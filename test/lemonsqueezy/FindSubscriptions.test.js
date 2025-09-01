const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindSubscriptions Component', function() {
    let context;
    let FindSubscriptions;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindSubscriptions = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/FindSubscriptions/FindSubscriptions.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.LEMONSQUEEZY_ACCESS_TOKEN
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

        assert(context.auth.apiKey, 'LEMONSQUEEZY_ACCESS_TOKEN environment variable is required for tests');
    });

    describe('Check the output port options for FindSubscriptions', function() {

        it('outputType: array', async function() {
            let data;
            context.sendJson = function(output, port) {
                data = output;
                return { data: output, port };
            };

            context.properties.generateOutputPortOptions = true;
            context.messages.in.content = { outputType: 'array' };

            await FindSubscriptions.receive(context);

            console.log('FindSubscriptions array output port options:', JSON.stringify(data, null, 2));
            assert(Array.isArray(data), 'Expected output port options to be an array');
        });

        it('outputType: object', async function() {
            let data;
            context.sendJson = function(output, port) {
                data = output;
                return { data: output, port };
            };

            context.properties.generateOutputPortOptions = true;
            context.messages.in.content = { outputType: 'object' };

            await FindSubscriptions.receive(context);

            console.log('FindSubscriptions object output port options:', JSON.stringify(data, null, 2));
            assert(Array.isArray(data), 'Expected output port options to be an array');
        });
    });

    it('should find subscriptions without filters', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties.generateOutputPortOptions = false;
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindSubscriptions.receive(context);

            console.log('FindSubscriptions result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected result to be an object');
            assert(Array.isArray(data.result), 'Expected result.result to be an array');
            assert(typeof data.count === 'number', 'Expected result.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const subscription = data.result[0];
                assert(subscription.id, 'Expected subscription to have id property');
                assert(subscription.type, 'Expected subscription to have type property');
                assert(subscription.attributes, 'Expected subscription to have attributes property');
                assert.strictEqual(subscription.type, 'subscriptions', `Expected type to be 'subscriptions', got: ${subscription.type}`);

                // Verify required fields are present
                const requiredFields = ['id', 'type', 'attributes'];
                for (const field of requiredFields) {
                    assert(field in subscription, `Expected subscription to have ${field} property`);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LEMONSQUEEZY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should find subscriptions with filters', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties.generateOutputPortOptions = false;
        context.messages.in.content = {
            store_id: process.env.LEMONSQUEEZY_STORE_ID,
            outputType: 'array'
        };

        try {
            await FindSubscriptions.receive(context);

            console.log('FindSubscriptions with filters result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected result to be an object');
            assert(Array.isArray(data.result), 'Expected result.result to be an array');
            assert(typeof data.count === 'number', 'Expected result.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            // Note: Results might be empty if no subscriptions match the filters, which is fine
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LEMONSQUEEZY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle object output type', async function() {
        context.properties.generateOutputPortOptions = false;
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
            await FindSubscriptions.receive(context);

            console.log('FindSubscriptions object output type calls count:', sendJsonCalls.length);

            // For object output type, each subscription should be sent individually
            if (sendJsonCalls.length > 0) {
                const callsToCheck = Math.min(sendJsonCalls.length, 3);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                    // Check that the subscription data is present
                    assert(call.data.id && call.data.type && call.data.attributes, `Expected call ${i} data to have subscription properties (id, type, attributes)`);
                }
                console.log(`All ${callsToCheck} checked calls have correct structure.`);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LEMONSQUEEZY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle first output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties.generateOutputPortOptions = false;
        context.messages.in.content = {
            outputType: 'first'
        };

        try {
            await FindSubscriptions.receive(context);

            console.log('FindSubscriptions first output type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected result to be an object');
            assert(typeof data.index === 'number', 'Expected result.index to be a number');
            assert(typeof data.count === 'number', 'Expected result.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LEMONSQUEEZY_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No subscriptions found for first output type test - this is expected if no subscriptions exist');
                return; // This is acceptable
            }
            throw error;
        }
    });
});
