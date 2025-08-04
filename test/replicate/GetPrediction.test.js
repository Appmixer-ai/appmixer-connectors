const path = require('path');
const { TestContext } = require('../helper');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('replicate.core.GetPrediction', () => {

    let context;

    beforeEach(() => {
        context = new TestContext({
            componentPath: 'src/appmixer/replicate/core/GetPrediction',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
    });

    it('should get prediction details', async () => {
        // First create a prediction to get its ID
        const createContext = new TestContext({
            componentPath: 'src/appmixer/replicate/core/CreatePrediction',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });

        const createOutput = await createContext.test({
            input: {
                version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
                input: {
                    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/256px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg'
                }
            }
        });

        const predictionId = createOutput.id;

        // Now get the prediction details
        const output = await context.test({
            input: {
                prediction_id: predictionId
            }
        });

        assert(output, 'Output should exist');
        assert(output.id === predictionId, 'Should return correct prediction ID');
        assert(typeof output.status === 'string', 'Should have status');
        assert(typeof output.version === 'string', 'Should have version');
        assert(typeof output.created_at === 'string', 'Should have created_at');
    });

    it('should fail without prediction_id', async () => {
        try {
            await context.test({
                input: {}
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Prediction ID is required'), 'Should require prediction ID');
        }
    });

    it('should fail with invalid prediction_id', async () => {
        try {
            await context.test({
                input: {
                    prediction_id: 'invalid-id'
                }
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            // This should fail with a 404 or similar error from the API
            assert(error.response && error.response.status >= 400, 'Should return API error for invalid ID');
        }
    });
});
