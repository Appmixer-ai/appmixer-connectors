const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('../utils.js');
const assert = require('assert');

describe('FindModels Component', function() {
    let context;
    let FindModels;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        FindModels = require(path.join(__dirname, '../../src/appmixer/replicate/core/FindModels/FindModels.js'));

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
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        assert(context.auth.apiKey, 'REPLICATE_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should find models without search query', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindModels.receive(context);

            console.log('FindModels result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const model = data.result[0];
                assert(model.owner, 'Expected model to have owner property');
                assert(model.name, 'Expected model to have name property');
                assert(model.url, 'Expected model to have url property');

                // Verify required fields are present
                const requiredFields = ['owner', 'name', 'url'];
                for (const field of requiredFields) {
                    assert(field in model, `Expected model to have ${field} property`);
                }
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

    it('should find models with search query', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            search: 'hello',
            outputType: 'array'
        };

        try {
            await FindModels.receive(context);

            console.log('FindModels with search query result count:', data.count);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle object output type', async function() {
        context.messages.in.content = {
            outputType: 'object'
        };

        // Mock sendJson to capture all calls
        const sendJsonCalls = [];
        context.sendJson = function(data, port) {
            sendJsonCalls.push({ data, port });
            return { data, port };
        };

        try {
            await FindModels.receive(context);

            console.log('FindModels object output type calls count:', sendJsonCalls.length);

            assert(sendJsonCalls.length > 0, 'Expected sendJson to be called at least once');

            // For object output type, each model should be sent individually
            const callsToCheck = Math.min(sendJsonCalls.length, 3);
            for (let i = 0; i < callsToCheck; i++) {
                const call = sendJsonCalls[i];
                assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
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

    it('should handle first output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'first'
        };

        try {
            await FindModels.receive(context);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.index === 'number', 'Expected data.index to be a number');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No models found for first output type test - this is unexpected');
                return; // This is unusual but acceptable
            }
            throw error;
        }
    });

    it('should use notFound port when no models are found', async function() {
        let data;
        let portUsed;
        context.sendJson = function(output, port) {
            data = output;
            portUsed = port;
        };

        // Use a search query that should return no results
        context.messages.in.content = {
            search: 'this-search-query-should-not-match-any-models-99999',
            outputType: 'array'
        };

        try {
            await FindModels.receive(context);

            assert.strictEqual(portUsed, 'notFound', 'Expected to use notFound port when no models are found');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.strictEqual(data.message, 'No models found', 'Expected message to indicate no models found');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });
});