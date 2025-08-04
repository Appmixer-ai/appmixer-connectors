const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetModel Component', function() {
    let context;
    let GetModel;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        GetModel = require(path.join(__dirname, '../../src/appmixer/replicate/core/GetModel/GetModel.js'));

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

    it('should get hello-world model details', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            model_owner: 'replicate',
            model_name: 'hello-world'
        };

        try {
            await GetModel.receive(context);

            console.log('GetModel result for hello-world:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.owner, 'Expected model to have owner property');
            assert(data.name, 'Expected model to have name property');
            assert(data.url, 'Expected model to have url property');
            assert(data.description, 'Expected model to have description property');

            // Verify specific values for hello-world model
            assert.strictEqual(data.owner, 'replicate', 'Expected owner to be "replicate"');
            assert.strictEqual(data.name, 'hello-world', 'Expected name to be "hello-world"');

            // Verify required fields are present
            const requiredFields = ['owner', 'name', 'url', 'description', 'visibility'];
            for (const field of requiredFields) {
                assert(field in data, `Expected model to have ${field} property`);
            }

            // Should have latest_version with schema information
            if (data.latest_version) {
                assert(data.latest_version.id, 'Expected latest_version to have id property');
                assert(data.latest_version.created_at, 'Expected latest_version to have created_at property');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle non-existent model', async function() {
        context.messages.in.content = {
            model_owner: 'nonexistent',
            model_name: 'nonexistent-model'
        };

        try {
            await GetModel.receive(context);
            assert.fail('Expected error for non-existent model');
        } catch (error) {
            // Should get a 404 error
            assert(error.response, 'Expected HTTP error response');
            assert.strictEqual(error.response.status, 404, `Expected 404 status code, got: ${error.response.status}`);
        }
    });
});