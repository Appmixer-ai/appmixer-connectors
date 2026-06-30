'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetProduct Component', function() {
    let context;
    let GetProduct;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        GetProduct = require(path.join(__dirname, '../../src/appmixer/bigCommerce/core/GetProduct/GetProduct.js'));

        // Mock context
        context = {
            auth: {
                storeHash: process.env.BIGCOMMERCE_STORE_HASH,
                accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN
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

        assert(context.auth.accessToken, 'BIGCOMMERCE_ACCESS_TOKEN environment variable is required for tests');
        assert(context.auth.storeHash, 'BIGCOMMERCE_STORE_HASH environment variable is required for tests');
    });

    it('should get a product by ID', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            product_id: '77' // Using a valid product ID from FindProducts results
        };

        try {
            await GetProduct.receive(context);

            console.log('GetProduct result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'number', 'Product should have numeric ID');
            assert(typeof data.name === 'string', 'Product should have name string');
        } catch (error) {
            console.error('GetProduct test error:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    });

    it('should throw error for missing product ID', async function() {
        context.messages.in.content = {}; // No product_id

        try {
            await GetProduct.receive(context);
            assert.fail('Should have thrown an error for missing product ID');
        } catch (error) {
            assert(error.message.includes('Product ID is required'), 'Should throw correct error message');
        }
    });
});
