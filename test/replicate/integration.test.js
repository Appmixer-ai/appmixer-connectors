const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('replicate connector integration test', () => {

    let predictionId;

    it('should complete full workflow: find models -> create prediction -> get prediction -> list predictions', async () => {
        
        // Step 1: Find models
        const findModelsContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/FindModels',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });

        const modelsOutput = await findModelsContext.test({
            input: {
                search: 'gfpgan',
                outputType: 'first'
            }
        });

        assert(modelsOutput, 'Should find models');
        assert(typeof modelsOutput.url === 'string', 'Model should have URL');
        assert(typeof modelsOutput.owner === 'string', 'Model should have owner');
        assert(typeof modelsOutput.name === 'string', 'Model should have name');
        
        console.log(`Found model: ${modelsOutput.owner}/${modelsOutput.name}`);

        // Step 2: Get model details
        const getModelContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/GetModel',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });

        const modelDetails = await getModelContext.test({
            input: {
                model_owner: 'tencentarc',
                model_name: 'gfpgan'
            }
        });

        assert(modelDetails, 'Should get model details');
        assert(typeof modelDetails.latest_version === 'object', 'Should have latest version');
        
        console.log(`Model description: ${modelDetails.description}`);

        // Step 3: Create a prediction
        const createPredictionContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/CreatePrediction',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });

        const predictionOutput = await createPredictionContext.test({
            input: {
                version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf', // GFPGAN version
                input: {
                    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/256px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg'
                }
            }
        });

        assert(predictionOutput, 'Should create prediction');
        assert(typeof predictionOutput.id === 'string', 'Should have prediction ID');
        assert(typeof predictionOutput.status === 'string', 'Should have status');
        
        predictionId = predictionOutput.id;
        console.log(`Created prediction: ${predictionId} with status: ${predictionOutput.status}`);

        // Step 4: Get prediction details
        const getPredictionContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/GetPrediction',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });

        const predictionDetails = await getPredictionContext.test({
            input: {
                prediction_id: predictionId
            }
        });

        assert(predictionDetails, 'Should get prediction details');
        assert(predictionDetails.id === predictionId, 'Should return correct prediction');
        assert(typeof predictionDetails.status === 'string', 'Should have status');
        
        console.log(`Prediction status: ${predictionDetails.status}`);

        // Step 5: List all predictions
        const findPredictionsContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/FindPredictions',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });

        const predictionsOutput = await findPredictionsContext.test({
            input: {
                outputType: 'array'
            }
        });

        assert(predictionsOutput, 'Should list predictions');
        assert(Array.isArray(predictionsOutput.result), 'Should return array of predictions');
        assert(typeof predictionsOutput.count === 'number', 'Should have count');
        
        // Check that our created prediction is in the list
        const foundPrediction = predictionsOutput.result.find(p => p.id === predictionId);
        assert(foundPrediction, 'Should find our created prediction in the list');
        
        console.log(`Found ${predictionsOutput.count} total predictions`);

        // Step 6: Test status filtering
        const succeededPredictions = await findPredictionsContext.test({
            input: {
                status: 'succeeded',
                outputType: 'array'
            }
        });

        assert(succeededPredictions, 'Should filter by status');
        assert(Array.isArray(succeededPredictions.result), 'Should return array');
        
        // All returned predictions should have succeeded status
        if (succeededPredictions.result.length > 0) {
            succeededPredictions.result.forEach(prediction => {
                assert(prediction.status === 'succeeded', 'Filtered predictions should have correct status');
            });
        }
        
        console.log(`Found ${succeededPredictions.count} succeeded predictions`);
    });

    it('should test output port schema generation', async () => {
        
        // Test FindModels output port generation
        const findModelsContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/FindModels',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
        findModelsContext.setProperties({ generateOutputPortOptions: true });

        const modelsSchema = await findModelsContext.test({
            input: {
                outputType: 'array'
            }
        });

        assert(Array.isArray(modelsSchema), 'Should return schema array');
        const resultOption = modelsSchema.find(option => option.value === 'result');
        assert(resultOption, 'Should have result option');
        assert(resultOption.schema.type === 'array', 'Result should be array type');

        // Test FindPredictions output port generation
        const findPredictionsContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/FindPredictions',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
        findPredictionsContext.setProperties({ generateOutputPortOptions: true });

        const predictionsSchema = await findPredictionsContext.test({
            input: {
                outputType: 'object'
            }
        });

        assert(Array.isArray(predictionsSchema), 'Should return schema array');
        const idOption = predictionsSchema.find(option => option.value === 'id');
        assert(idOption, 'Should have id option');
        assert(idOption.schema.type === 'string', 'ID should be string type');
        
        const statusOption = predictionsSchema.find(option => option.value === 'status');
        assert(statusOption, 'Should have status option');
        assert(statusOption.schema.type === 'string', 'Status should be string type');
    });

    after(async () => {
        // Clean up: try to cancel the prediction if it's still running
        if (predictionId) {
            try {
                const cancelContext = new TestContext({
                    componentPath: 'src/appmixer/replicate/core/CancelPrediction',
                    apiKey: process.env.REPLICATE_ACCESS_TOKEN
                });

                await cancelContext.test({
                    input: {
                        prediction_id: predictionId
                    }
                });
                
                console.log(`Cleaned up prediction: ${predictionId}`);
            } catch (error) {
                // It's okay if we can't cancel (e.g., already completed)
                console.log(`Could not cancel prediction ${predictionId} - likely already completed`);
            }
        }
    });
});
