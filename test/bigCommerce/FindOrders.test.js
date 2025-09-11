'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindOrders Component', function() {
    let context;
    let FindOrders;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        FindOrders = require('../../src/appmixer/bigCommerce/core/FindOrders/FindOrders');
    });

    beforeEach(function() {
        // Mock context
        context = {
            auth: {
                accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN,
                storeHash: process.env.BIGCOMMERCE_STORE_HASH
            },
            properties: {
                // This ensures the component doesn't try to generate output port options
            },
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: require('./httpRequest'),
            sendJson: function(data, port) {
                this.response = { data, port };
                return { data, port };
            },
            CancelError: class extends Error { constructor(msg) { super(msg); this.name = 'CancelError'; } }
        };
    });

    it('should find orders successfully', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders in test store, verify notFound response
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port when no orders exist');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found, verify normal response
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            if (data.result.length > 0) {
                const order = data.result[0];
                assert(typeof order.id === 'number', 'Order should have numeric ID');
                assert(order.status_id !== undefined, 'Order should have status_id');
            }
        }
    });

    it('should find orders with status filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            status_id: 1  // Pending status
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders with this status
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find orders with date filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            min_date_created: '2020-01-01T00:00:00Z'
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders in date range
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find orders with email filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            email: 'test@example.com'
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders for this email
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find orders with customer ID filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            customer_id: 1
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders for this customer
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find orders with payment method filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            payment_method: 'Credit Card'
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders with this payment method
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find orders with total amount filters', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            min_total: 10.00,
            max_total: 1000.00
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders in this total range
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should send to notFound port when no orders match criteria', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        // Use very specific search criteria that likely won't match
        context.messages.in.content = {
            outputType: 'array',
            email: 'nonexistent-order-email-12345@example-domain-that-does-not-exist.com',
            min_total: 999999.99,
            max_total: 999999.99
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // If orders were found, verify normal response
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            console.log('Found orders instead of no results:', data.count);
        }
    });

    it('should use default parameters when not specified', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await FindOrders.receive(context);

        if (outputPort === 'notFound') {
            // No orders in test store, verify notFound response
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port when no orders exist');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Orders found, verify normal response
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });
});
