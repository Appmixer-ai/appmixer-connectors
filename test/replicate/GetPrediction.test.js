const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetPrediction Component', function() {
    let context;
    let GetPrediction;
    let CreatePrediction;
    let predictionId;

    this.timeout(60000);

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        GetPrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/GetPrediction/GetPrediction.js'));
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

        // Create a prediction to test with
        let predictionData;
        context.sendJson = function(output, port) {
            predictionData = output;
        };

        context.messages.in.content = {
            version: 'replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
            input: {
                text: 'Test for GetPrediction'
            }
        };

        await CreatePrediction.receive(context);
        predictionId = predictionData.id;
        
        console.log('Created prediction for testing:', predictionId);
        assert(predictionId, 'Failed to create prediction for testing');
    });

    it('should get prediction by ID', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            prediction_id: predictionId
        };

        try {
            await GetPrediction.receive(context);

            console.log('GetPrediction result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected prediction to have id property');
            assert(data.status, 'Expected prediction to have status property');
            assert(data.version, 'Expected prediction to have version property');
            assert(data.input, 'Expected prediction to have input property');

            // Verify the ID matches what we requested
            assert.strictEqual(data.id, predictionId, 'Expected prediction ID to match requested ID');

            // Verify required fields are present
            const requiredFields = ['id', 'status', 'version', 'input', 'created_at'];
            for (const field of requiredFields) {
                assert(field in data, `Expected prediction to have ${field} property`);
            }

            // Status should be one of the expected values
            const validStatuses = ['starting', 'processing', 'succeeded', 'failed', 'canceled'];
            assert(validStatuses.includes(data.status), `Expected status to be one of ${validStatuses.join(', ')}, got: ${data.status}`);

            // Verify input matches what we created
            assert.deepStrictEqual(data.input, { text: 'Test for GetPrediction' }, 'Expected input to match what was created');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle non-existent prediction ID', async function() {
        context.messages.in.content = {
            prediction_id: 'nonexistent-prediction-id'
        };

        try {
            await GetPrediction.receive(context);
            assert.fail('Expected error for non-existent prediction ID');
        } catch (error) {
            // Should get a 404 or similar error
            assert(error.response, 'Expected HTTP error response');
            assert([404, 422].includes(error.response.status), `Expected 404 or 422 status code, got: ${error.response.status}`);
        }
    });
});