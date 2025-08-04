const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreatePrediction Component', function() {
    let context;
    let CreatePrediction;

    this.timeout(60000); // Predictions can take time

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
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

    it('should create a prediction with hello-world model', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            version: 'replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
            input: {
                text: 'Test User'
            }
        };

        try {
            await CreatePrediction.receive(context);

            console.log('CreatePrediction result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected prediction to have id property');
            assert(data.status, 'Expected prediction to have status property');
            assert(data.version, 'Expected prediction to have version property');
            assert(data.input, 'Expected prediction to have input property');

            // Verify required fields are present
            const requiredFields = ['id', 'status', 'version', 'input'];
            for (const field of requiredFields) {
                assert(field in data, `Expected prediction to have ${field} property`);
            }

            // Verify input matches what we sent
            assert.deepStrictEqual(data.input, { text: 'Test User' }, 'Expected input to match what was sent');
            
            // Status should be one of the expected values
            const validStatuses = ['starting', 'processing', 'succeeded', 'failed', 'canceled'];
            assert(validStatuses.includes(data.status), `Expected status to be one of ${validStatuses.join(', ')}, got: ${data.status}`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should create a prediction with input as JSON string', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            version: 'replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
            input: '{"text": "JSON String Input"}'
        };

        try {
            await CreatePrediction.receive(context);

            console.log('CreatePrediction with JSON string input result:', data.id);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected prediction to have id property');
            assert(data.status, 'Expected prediction to have status property');
            
            // Verify input was parsed correctly
            assert.deepStrictEqual(data.input, { text: 'JSON String Input' }, 'Expected input to be parsed from JSON string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle invalid JSON input gracefully', async function() {
        context.messages.in.content = {
            version: 'replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa',
            input: 'invalid json {'
        };

        try {
            await CreatePrediction.receive(context);
            assert.fail('Expected error for invalid JSON input');
        } catch (error) {
            assert(error.message.includes('Invalid input JSON format'), 'Expected error message about invalid JSON format');
        }
    });
});