'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateProduct Component', function() {
    let context;
    let UpdateProduct;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        UpdateProduct = require('../../src/appmixer/bigCommerce/core/UpdateProduct/UpdateProduct');
    });

    beforeEach(function() {
        // Mock context
        context = {
            auth: {
                accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN,
                storeHash: process.env.BIGCOMMERCE_STORE_HASH
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

    it('should require product_id', async function() {
        context.messages.in.content = {
            name: 'Updated Product Name'
        };

        try {
            await UpdateProduct.receive(context);
            assert.fail('Should have thrown error for missing product_id');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product ID is required!');
        }
    });

    it('should update a product successfully', async function() {
        // First, get an existing product ID to update
        const findResponse = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products?limit=1`,
            headers: {
                'X-Auth-Token': context.auth.accessToken,
                'Accept': 'application/json'
            }
        });

        assert(Array.isArray(findResponse.data.data), 'Should return products array');
        assert(findResponse.data.data.length > 0, 'Should have at least one product');
        const existingProduct = findResponse.data.data[0];

        context.messages.in.content = {
            product_id: existingProduct.id,
            name: `Updated Product ${Date.now()}`,
            price: '25.99'
        };

        const result = await UpdateProduct.receive(context);

        assert.deepStrictEqual(result, {
            data: {},
            port: 'out'
        });
    });

    it('should update only provided fields', async function() {
        // First, get an existing product ID to update
        const findResponse = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products?limit=1`,
            headers: {
                'X-Auth-Token': context.auth.accessToken,
                'Accept': 'application/json'
            }
        });

        assert(Array.isArray(findResponse.data.data), 'Should return products array');
        assert(findResponse.data.data.length > 0, 'Should have at least one product');
        const existingProduct = findResponse.data.data[0];

        context.messages.in.content = {
            product_id: existingProduct.id,
            name: `Only Name Updated ${Date.now()}`
            // Only providing name, not price or is_visible
        };

        const result = await UpdateProduct.receive(context);

        assert.deepStrictEqual(result, {
            data: {},
            port: 'out'
        });
    });
});
