const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindStores Component', function() {
    let context;
    let FindStores;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindStores = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/FindStores/FindStores.js'));

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

    describe('Check the output port options for FindStores', function() {

        it('outputType: array', async function() {
            let data;
            context.sendJson = function(output, port) {
                data = output;
                return { data: output, port };
            };

            context.properties.generateOutputPortOptions = true;
            context.messages.in.content = { outputType: 'array' };

            await FindStores.receive(context);

            console.log('FindStores array output port options:', JSON.stringify(data, null, 2));
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

            await FindStores.receive(context);

            console.log('FindStores object output port options:', JSON.stringify(data, null, 2));
            assert(Array.isArray(data), 'Expected output port options to be an array');
        });
    });

    it('should find stores successfully', async function() {
        let data;
        let port;
        context.sendJson = function(output, outputPort) {
            data = output;
            port = outputPort;
        };

        context.properties.generateOutputPortOptions = false;
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindStores.receive(context);

            console.log('FindStores result:', JSON.stringify(data, null, 2));

            if (port === 'notFound') {
                console.log('No stores found - this might be expected for some accounts');
                return;
            }

            assert(data && typeof data === 'object', 'Expected result to be an object');
            assert(Array.isArray(data.result), 'Expected result.result to be an array');
            assert(typeof data.count === 'number', 'Expected result.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const store = data.result[0];
                assert(store.id, 'Expected store to have id property');
                assert(store.type, 'Expected store to have type property');
                assert(store.attributes, 'Expected store to have attributes property');
                assert.strictEqual(store.type, 'stores', `Expected type to be 'stores', got: ${store.type}`);

                // Verify store attributes
                assert(store.attributes.name, 'Expected store to have name attribute');
                assert(store.attributes.domain, 'Expected store to have domain attribute');

                // Verify required fields are present
                const requiredFields = ['id', 'type', 'attributes'];
                for (const field of requiredFields) {
                    assert(field in store, `Expected store to have ${field} property`);
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
            await FindStores.receive(context);

            console.log('FindStores object output type calls count:', sendJsonCalls.length);

            // Check if notFound was sent (no stores available)
            if (sendJsonCalls.length === 1 && sendJsonCalls[0].port === 'notFound') {
                console.log('No stores found - sent to notFound port');
                return;
            }

            // For object output type, each store should be sent individually
            if (sendJsonCalls.length > 0) {
                const callsToCheck = Math.min(sendJsonCalls.length, 3);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                    // Check that the store data is present
                    assert(call.data.id && call.data.type && call.data.attributes, `Expected call ${i} data to have store properties (id, type, attributes)`);
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
        let port;
        context.sendJson = function(output, outputPort) {
            data = output;
            port = outputPort;
        };

        context.properties.generateOutputPortOptions = false;
        context.messages.in.content = {
            outputType: 'first'
        };

        try {
            await FindStores.receive(context);

            console.log('FindStores first output type result:', JSON.stringify(data, null, 2));

            if (port === 'notFound') {
                console.log('No stores found for first output type test');
                return;
            }

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
                console.log('No stores found for first output type test - this is expected if no stores exist');
                return; // This is acceptable
            }
            throw error;
        }
    });
});
