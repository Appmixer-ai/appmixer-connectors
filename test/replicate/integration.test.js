const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { createMockContext } = require('../utils.js');
const axios = require('axios');

describe('replicate connector integration test', function() {
    let predictionId;

    this.timeout(60000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    it('should complete full workflow: find models -> create prediction -> get prediction -> list predictions', async function() {

        // Step 1: List models
        const ListPublicModels = require(path.join(__dirname, '../../src/appmixer/replicate/core/ListPublicModels/ListPublicModels.js'));
        let listModelsContext = createMockContext({
            auth: { apiKey: process.env.REPLICATE_ACCESS_TOKEN },
            messages: { in: { content: { outputType: 'first' } } },
            httpRequest: async (options) => await axios(options),
            CancelError: Error
        });

        let modelsOutput;
        listModelsContext.sendJson = function(output, port) {
            modelsOutput = output;
        };

        await ListPublicModels.receive(listModelsContext);

        assert(modelsOutput, 'Should find models');
        assert(typeof modelsOutput.url === 'string', 'Model should have URL');
        assert(typeof modelsOutput.owner === 'string', 'Model should have owner');
        assert(typeof modelsOutput.name === 'string', 'Model should have name');

        console.log(`Found model: ${modelsOutput.owner}/${modelsOutput.name}`);

        // Step 2: Get model details
        const GetModel = require(path.join(__dirname, '../../src/appmixer/replicate/core/GetModel/GetModel.js'));
        let getModelContext = createMockContext({
            auth: { apiKey: process.env.REPLICATE_ACCESS_TOKEN },
            messages: { in: { content: { modelOwner: 'tencentarc', modelName: 'gfpgan' } } },
            httpRequest: async (options) => await axios(options),
            CancelError: Error
        });

        let modelDetails;
        getModelContext.sendJson = function(output, port) {
            modelDetails = output;
        };

        await GetModel.receive(getModelContext);

        assert(modelDetails, 'Should get model details');
        console.log(`Model description: ${modelDetails.description}`);

        // Step 3: Create a prediction
        const CreatePrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/CreatePrediction/CreatePrediction.js'));
        let createPredictionContext = createMockContext({
            auth: { apiKey: process.env.REPLICATE_ACCESS_TOKEN },
            messages: {
                in: {
                    content: {
                        version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf', // GFPGAN version
                        input: JSON.stringify({
                            img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/256px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg'
                        })
                    }
                }
            },
            httpRequest: async (options) => await axios(options),
            CancelError: Error
        });

        let predictionOutput;
        createPredictionContext.sendJson = function(output, port) {
            predictionOutput = output;
        };

        await CreatePrediction.receive(createPredictionContext);

        assert(predictionOutput, 'Should create prediction');
        assert(typeof predictionOutput.id === 'string', 'Should have prediction ID');
        assert(typeof predictionOutput.status === 'string', 'Should have status');

        predictionId = predictionOutput.id;
        console.log(`Created prediction: ${predictionId} with status: ${predictionOutput.status}`);

        // Step 4: Get prediction details
        const GetPrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/GetPrediction/GetPrediction.js'));
        let getPredictionContext = createMockContext({
            auth: { apiKey: process.env.REPLICATE_ACCESS_TOKEN },
            messages: { in: { content: { predictionId: predictionId } } },
            httpRequest: async (options) => await axios(options),
            CancelError: Error
        });

        let predictionDetails;
        getPredictionContext.sendJson = function(output, port) {
            predictionDetails = output;
        };

        await GetPrediction.receive(getPredictionContext);

        assert(predictionDetails, 'Should get prediction details');
        assert(predictionDetails.id === predictionId, 'Should return correct prediction');
        assert(typeof predictionDetails.status === 'string', 'Should have status');

        console.log(`Prediction status: ${predictionDetails.status}`);

        // Step 5: List all predictions
        const ListPredictions = require(path.join(__dirname, '../../src/appmixer/replicate/core/ListPredictions/ListPredictions.js'));
        let listPredictionsContext = createMockContext({
            auth: { apiKey: process.env.REPLICATE_ACCESS_TOKEN },
            messages: { in: { content: { outputType: 'array' } } },
            httpRequest: async (options) => await axios(options),
            CancelError: Error
        });

        let predictionsOutput;
        listPredictionsContext.sendJson = function(output, port) {
            predictionsOutput = output;
        };

        await ListPredictions.receive(listPredictionsContext);

        assert(predictionsOutput, 'Should list predictions');
        assert(Array.isArray(predictionsOutput.result), 'Should return array of predictions');
        assert(typeof predictionsOutput.count === 'number', 'Should have count');

        // Check that our created prediction is in the list
        const foundPrediction = predictionsOutput.result.find(p => p.id === predictionId);
        assert(foundPrediction, 'Should find our created prediction in the list');

        console.log(`Found ${predictionsOutput.count} total predictions`);
    });

    after(async function() {
        // Clean up: try to cancel the prediction if it's still running
        if (predictionId) {
            try {
                const CancelPrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/CancelPrediction/CancelPrediction.js'));
                let cancelContext = createMockContext({
                    auth: { apiKey: process.env.REPLICATE_ACCESS_TOKEN },
                    messages: { in: { content: { predictionId: predictionId } } },
                    httpRequest: async (options) => await axios(options),
                    CancelError: Error
                });

                await CancelPrediction.receive(cancelContext);
                console.log(`Cleaned up prediction: ${predictionId}`);
            } catch (error) {
                // It's okay if we can't cancel (e.g., already completed)
                console.log(`Could not cancel prediction ${predictionId} - likely already completed`);
            }
        }
    });
});
