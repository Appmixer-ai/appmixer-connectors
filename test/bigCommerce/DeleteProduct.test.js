'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('DeleteProduct Component', function() {
    let context;
    let DeleteProduct;
    let CreateProduct;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the components
        DeleteProduct = require('../../src/appmixer/bigCommerce/core/DeleteProduct/DeleteProduct');
        CreateProduct = require('../../src/appmixer/bigCommerce/core/CreateProduct/CreateProduct');
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
        context.messages.in.content = {};

        try {
            await DeleteProduct.receive(context);
            assert.fail('Should have thrown error for missing product_id');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product ID is required!');
        }
    });

    it('should delete a product successfully', async function() {
        // First, create a product to delete
        context.messages.in.content = {
            name: `Test Product for Deletion ${Date.now()}`,
            type: 'physical',
            weight: 1,
            price: '15.99'
        };

        const createResult = await CreateProduct.receive(context);
        assert(createResult.data, 'Should create product');
        assert(createResult.data.id, 'Should have product ID');

        const productId = createResult.data.id;

        // Now delete the created product
        context.messages.in.content = {
            product_id: productId
        };

        const deleteResult = await DeleteProduct.receive(context);

        assert.deepStrictEqual(deleteResult, {
            data: {},
            port: 'out'
        });

        // Verify the product is deleted by trying to get it (should fail)
        try {
            await context.httpRequest({
                method: 'GET',
                url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/catalog/products/${productId}`,
                headers: {
                    'X-Auth-Token': context.auth.accessToken,
                    'Accept': 'application/json'
                }
            });
            assert.fail('Product should have been deleted');
        } catch (error) {
            // Expected - product should not exist anymore
            assert(error.response && error.response.status === 404, 'Product should return 404 after deletion');
        }
    });
});
