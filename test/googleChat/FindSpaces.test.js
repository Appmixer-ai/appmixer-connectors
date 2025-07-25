const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindSpaces Component', function() {
    let context;
    let FindSpaces;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_CHAT_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_CHAT_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        FindSpaces = require(path.join(__dirname, '../../src/appmixer/googleChat/core/FindSpaces/FindSpaces.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.GOOGLE_CHAT_ACCESS_TOKEN
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

        assert(context.auth.accessToken, 'GOOGLE_CHAT_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should find spaces without query', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindSpaces.receive(context);

            console.log('FindSpaces result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const space = data.result[0];
                assert(space.name, 'Expected space to have name property');
                
                // Verify required fields are present
                const requiredFields = ['name'];
                for (const field of requiredFields) {
                    assert(field in space, `Expected space to have ${field} property`);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_CHAT_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should default to array output type when not specified', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {};

        try {
            await FindSpaces.receive(context);

            console.log('FindSpaces default output type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_CHAT_ACCESS_TOKEN in .env file');
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
            await FindSpaces.receive(context);

            console.log('FindSpaces object output type calls count:', sendJsonCalls.length);
            if (sendJsonCalls.length > 0) {
                console.log('First call data keys:', Object.keys(sendJsonCalls[0].data));
            }

            assert(sendJsonCalls.length > 0, 'Expected sendJson to be called at least once');

            // For object output type, each space should be sent individually
            // Let's just check the first few calls to avoid overwhelming output
            const callsToCheck = Math.min(sendJsonCalls.length, 3);
            for (let i = 0; i < callsToCheck; i++) {
                const call = sendJsonCalls[i];
                assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                // Check that the space data is present
                assert(call.data.name, `Expected call ${i} data to have name property`);
            }
            console.log(`All ${callsToCheck} checked calls have correct structure.`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_CHAT_ACCESS_TOKEN in .env file');
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
            await FindSpaces.receive(context);

            console.log('FindSpaces first output type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.index === 'number', 'Expected data.index to be a number');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_CHAT_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No spaces found for first output type test - this is expected if no spaces exist');
                return; // This is acceptable
            }
            throw error;
        }
    });

    it('should generate output port options', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties.generateOutputPortOptions = true;
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindSpaces.receive(context);

            console.log('FindSpaces output port options:', JSON.stringify(data, null, 2));

            assert(Array.isArray(data), 'Expected output port options to be an array');
            if (data.length > 0) {
                assert(data[0].label, 'Expected option to have label property');
                assert(data[0].value, 'Expected option to have value property');
            }
        } catch (error) {
            throw error;
        }
    });
});
