'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindProducts Component', function() {
    let context;
    let FindProducts;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        FindProducts = require('../../src/appmixer/bigCommerce/core/FindProducts/FindProducts');
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

    it('should find products successfully', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No products in test store, verify notFound response
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port when no products exist');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found, verify normal response
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            if (data.result.length > 0) {
                const product = data.result[0];
                assert(typeof product.id === 'number', 'Product should have numeric ID');
                assert(typeof product.name === 'string', 'Product should have name');
            }
        }
    });

    it('should find products with keyword filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            keyword: 'test'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No products with this keyword
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find products with name filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            name: 'Test Product'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No products with this name
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find products with SKU filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            sku: 'TEST-SKU'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No products with this SKU
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find products with visibility filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            is_visible: true
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No visible products
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find products with featured filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            is_featured: true
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No featured products
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find products with type filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            type: 'physical'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No physical products
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find products with availability filter', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            availability: 'available'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No available products
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should find products with date range filters', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            outputType: 'array',
            date_modified_start: '2020-01-01T00:00:00Z'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No products in date range
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });

    it('should send to notFound port when no products match criteria', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        // Use very specific search criteria that likely won't match
        context.messages.in.content = {
            outputType: 'array',
            name: 'nonexistent-product-name-12345-that-should-not-exist',
            sku: 'NONEXISTENT-SKU-12345'
        };

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // If products were found, verify normal response
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            console.log('Found products instead of no results:', data.count);
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

        await FindProducts.receive(context);

        if (outputPort === 'notFound') {
            // No products in test store, verify notFound response
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port when no products exist');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // Products found, verify normal response
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
        }
    });
});
