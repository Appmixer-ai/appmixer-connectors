const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CancelPrediction Component', function() {
    let context;
    let CancelPrediction;
    let CreatePrediction;

    this.timeout(60000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        CancelPrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/CancelPrediction/CancelPrediction.js'));
        CreatePrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/CreatePrediction/CreatePrediction.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.REPLICATE_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: require('./httpRequest.js')
        };

        assert(context.auth.apiKey, 'REPLICATE_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should cancel a prediction', async function() {
        // First create a prediction to cancel
        let predictionData;
        context.sendJson = function(output, port) {
            predictionData = output;
        };

        context.messages.in.content = {
            version: 'replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
            input: {
                text: 'Test for cancellation'
            }
        };

        await CreatePrediction.receive(context);
        const predictionId = predictionData.id;
        
        console.log('Created prediction for cancellation test:', predictionId);
        assert(predictionId, 'Failed to create prediction for cancellation test');

        // Now cancel the prediction
        let cancelData;
        context.sendJson = function(output, port) {
            cancelData = output;
        };

        context.messages.in.content = {
            prediction_id: predictionId
        };

        try {
            await CancelPrediction.receive(context);

            console.log('CancelPrediction result:', JSON.stringify(cancelData, null, 2));

            assert(cancelData && typeof cancelData === 'object', 'Expected data to be an object');
            assert(cancelData.id, 'Expected prediction to have id property');
            assert(cancelData.status, 'Expected prediction to have status property');

            // Verify the ID matches what we requested to cancel
            assert.strictEqual(cancelData.id, predictionId, 'Expected prediction ID to match requested ID');

            // Status should be canceled or still processing (if it finished too quickly)
            const validStatuses = ['starting', 'processing', 'succeeded', 'failed', 'canceled'];
            assert(validStatuses.includes(cancelData.status), `Expected status to be one of ${validStatuses.join(', ')}, got: ${cancelData.status}`);

            console.log(`Prediction ${predictionId} status after cancellation: ${cancelData.status}`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle non-existent prediction ID for cancellation', async function() {
        context.messages.in.content = {
            prediction_id: 'nonexistent-prediction-id'
        };

        try {
            await CancelPrediction.receive(context);
            assert.fail('Expected error for non-existent prediction ID');
        } catch (error) {
            // Should get a 404 or similar error
            assert(error.response, 'Expected HTTP error response');
            assert([404, 422].includes(error.response.status), `Expected 404 or 422 status code, got: ${error.response.status}`);
        }
    });
});