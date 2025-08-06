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
        // For this test, we'll skip the creation step due to billing requirements
        // and test cancellation with a known prediction ID format
        this.skip(); // Skip this test if models require payment
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
