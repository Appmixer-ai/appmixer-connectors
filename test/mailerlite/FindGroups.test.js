const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindGroups Component', function() {
    let context;
    let FindGroups;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.MAILERLITE_ACCESS_TOKEN) {
            console.log('Skipping tests - MAILERLITE_ACCESS_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        FindGroups = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/FindGroups/FindGroups.js'));

        // Mock context
        context = {
            auth: {
                apiToken: process.env.MAILERLITE_ACCESS_TOKEN
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

        assert(context.auth.apiToken, 'MAILERLITE_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should find groups in array format', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindGroups.receive(context);

            console.log('FindGroups result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const group = data.result[0];
                assert(group.id, 'Expected group to have id property');
                assert(group.name, 'Expected group to have name property');

                // Verify required fields are present
                const requiredFields = ['id', 'name'];
                for (const field of requiredFields) {
                    assert(field in group, `Expected group to have ${field} property`);
                }

                // Store first group ID for other tests
                global.testGroupId = group.id;
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
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
            await FindGroups.receive(context);

            console.log('FindGroups object output type calls count:', sendJsonCalls.length);
            if (sendJsonCalls.length > 0) {
                console.log('First call data keys:', Object.keys(sendJsonCalls[0].data));
            }

            assert(sendJsonCalls.length > 0, 'Expected sendJson to be called at least once');

            // For object output type, each group should be sent individually
            const callsToCheck = Math.min(sendJsonCalls.length, 5);
            for (let i = 0; i < callsToCheck; i++) {
                const call = sendJsonCalls[i];
                assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                // Check that the group data is present
                assert(call.data.id && call.data.name, `Expected call ${i} data to have group properties (id, name)`);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
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
            await FindGroups.receive(context);

            console.log('FindGroups first output type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.index === 'number', 'Expected data.index to be a number');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No groups found for first output type test - this is expected if no groups exist');
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
            await FindGroups.receive(context);

            console.log('FindGroups output port options:', JSON.stringify(data, null, 2));

            assert(Array.isArray(data), 'Expected output port options to be an array');
            assert(data.length > 0, 'Expected output port options to have items');

            // Check structure of output port options
            const firstOption = data[0];
            assert(typeof firstOption.label === 'string', 'Expected option to have label string');
            assert(typeof firstOption.value === 'string', 'Expected option to have value string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });
});
