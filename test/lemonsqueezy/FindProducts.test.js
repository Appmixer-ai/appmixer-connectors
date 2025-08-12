const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindProducts Component', function() {
    let context;
    let FindProducts;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindProducts = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/FindProducts/FindProducts.js'));

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

    describe('Check the output port options for FindProducts', function() {

        it('outputType: array', async function() {
            let data;
            context.sendJson = function(output, port) {
                data = output;
                return { data: output, port };
            };

            context.properties.generateOutputPortOptions = true;
            context.messages.in.content = { outputType: 'array' };

            await FindProducts.receive(context);

            console.log('FindProducts array output port options:', JSON.stringify(data, null, 2));
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

            await FindProducts.receive(context);

            console.log('FindProducts object output port options:', JSON.stringify(data, null, 2));
            assert(Array.isArray(data), 'Expected output port options to be an array');
        });
    });

    it('should find products without store filter', async function() {
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
            await FindProducts.receive(context);

            console.log('FindProducts result:', JSON.stringify(data, null, 2));

            if (port === 'notFound') {
                console.log('No products found - this might be expected for some accounts');
                return;
            }

            assert(data && typeof data === 'object', 'Expected result to be an object');
            assert(Array.isArray(data.result), 'Expected result.result to be an array');
            assert(typeof data.count === 'number', 'Expected result.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const product = data.result[0];
                assert(product.id, 'Expected product to have id property');
                assert(product.type, 'Expected product to have type property');
                assert(product.attributes, 'Expected product to have attributes property');
                assert.strictEqual(product.type, 'products', `Expected type to be 'products', got: ${product.type}`);

                // Verify product attributes
                assert(product.attributes.name, 'Expected product to have name attribute');

                // Verify required fields are present
                const requiredFields = ['id', 'type', 'attributes'];
                for (const field of requiredFields) {
                    assert(field in product, `Expected product to have ${field} property`);
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

    it('should find products with store_id filter', async function() {
        let data;
        let port;
        context.sendJson = function(output, outputPort) {
            data = output;
            port = outputPort;
        };

        context.properties.generateOutputPortOptions = false;
        context.messages.in.content = {
            store_id: '12345',
            outputType: 'array'
        };

        try {
            await FindProducts.receive(context);

            console.log('FindProducts with store_id filter result:', JSON.stringify(data, null, 2));

            if (port === 'notFound') {
                console.log('No products found for specified store_id - this is expected if store has no products');
                return;
            }

            assert(data && typeof data === 'object', 'Expected result to be an object');
            assert(Array.isArray(data.result), 'Expected result.result to be an array');
            assert(typeof data.count === 'number', 'Expected result.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

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
            await FindProducts.receive(context);

            console.log('FindProducts object output type calls count:', sendJsonCalls.length);

            // Check if notFound was sent (no products available)
            if (sendJsonCalls.length === 1 && sendJsonCalls[0].port === 'notFound') {
                console.log('No products found - sent to notFound port');
                return;
            }

            // For object output type, each product should be sent individually
            if (sendJsonCalls.length > 0) {
                const callsToCheck = Math.min(sendJsonCalls.length, 3);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                    // Check that the product data is present
                    assert(call.data.id && call.data.type && call.data.attributes, `Expected call ${i} data to have product properties (id, type, attributes)`);
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
            await FindProducts.receive(context);

            console.log('FindProducts first output type result:', JSON.stringify(data, null, 2));

            if (port === 'notFound') {
                console.log('No products found for first output type test');
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
                console.log('No products found for first output type test - this is expected if no products exist');
                return; // This is acceptable
            }
            throw error;
        }
    });
});
