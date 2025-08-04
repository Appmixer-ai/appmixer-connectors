const path = require('path');
const { TestContext } = require('../helper');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('replicate.core.CancelPrediction', () => {

    let context;

    beforeEach(() => {
        context = new TestContext({
            componentPath: 'src/appmixer/replicate/core/CancelPrediction',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
    });

    it('should cancel a prediction', async () => {
        // First create a prediction to cancel
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

        // Now try to cancel it (it might already be completed, which is fine)
        try {
            const output = await context.test({
                input: {
                    prediction_id: predictionId
                }
            });

            assert(output, 'Output should exist');
            assert(output.id === predictionId, 'Should return correct prediction ID');
            assert(typeof output.status === 'string', 'Should have status');
            // Status could be 'canceled' or remain the same if already completed
        } catch (error) {
            // It's acceptable if the prediction can't be canceled (e.g., already completed)
            // Just verify it's a proper API response error
            if (error.response && error.response.status === 422) {
                // 422 is expected when trying to cancel a completed prediction
                console.log('Prediction already completed, cannot cancel - this is expected');
            } else {
                throw error;
            }
        }
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
