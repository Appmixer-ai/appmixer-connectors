'use strict';

const assert = require('assert');
const CreateProduct = require('../../src/appmixer/bigCommerce/core/CreateProduct/CreateProduct');
const httpRequest = require('./httpRequest');

describe('CreateProduct Component', function() {

    let context;

    this.timeout(30000);

    before(function() {
        // Skip API tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping API tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
        }
    });

    beforeEach(function() {

        context = {
            messages: {
                in: {
                    content: {}
                }
            },
            auth: {
                storeHash: process.env.BIGCOMMERCE_STORE_HASH || 'test-store',
                accessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN || 'test-token'
            },
            httpRequest,
            sendJson: (data, port) => ({ data, port }),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    it('should require product name', async function() {
        context.messages.in.content = {
            type: 'physical',
            price: 19.99,
            weight: 1
        };

        try {
            await CreateProduct.receive(context);
            assert.fail('Should have thrown error for missing name');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product name is required!');
        }
    });

    it('should require product type', async function() {
        context.messages.in.content = {
            name: 'Test Product',
            price: 19.99,
            weight: 1
        };

        try {
            await CreateProduct.receive(context);
            assert.fail('Should have thrown error for missing type');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product type is required!');
        }
    });

    it('should require product price', async function() {
        context.messages.in.content = {
            name: 'Test Product',
            type: 'physical',
            weight: 1
        };

        try {
            await CreateProduct.receive(context);
            assert.fail('Should have thrown error for missing price');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product price is required!');
        }
    });

    it('should require product weight', async function() {
        context.messages.in.content = {
            name: 'Test Product',
            type: 'physical',
            price: 19.99
        };

        try {
            await CreateProduct.receive(context);
            assert.fail('Should have thrown error for missing weight');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product weight is required!');
        }
    });

    it('should validate product name length (max 250 characters)', async function() {
        context.messages.in.content = {
            name: 'A'.repeat(251), // 251 characters
            type: 'physical',
            price: 19.99,
            weight: 1
        };

        try {
            await CreateProduct.receive(context);
            assert.fail('Should have thrown error for name too long');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product name must be 250 characters or less!');
        }
    });

    it('should validate price is non-negative', async function() {
        context.messages.in.content = {
            name: 'Test Product',
            type: 'physical',
            price: -1,
            weight: 1
        };

        try {
            await CreateProduct.receive(context);
            assert.fail('Should have thrown error for negative price');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product price must be 0 or greater!');
        }
    });

    it('should validate weight is non-negative', async function() {
        context.messages.in.content = {
            name: 'Test Product',
            type: 'physical',
            price: 19.99,
            weight: -1
        };

        try {
            await CreateProduct.receive(context);
            assert.fail('Should have thrown error for negative weight');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Product weight must be 0 or greater!');
        }
    });

    it('should create product with required fields only', async function() {
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            this.skip();
        }

        // Generate unique name to avoid conflicts
        const timestamp = Date.now();
        context.messages.in.content = {
            name: `Test Product ${timestamp}`,
            type: 'physical',
            price: 19.99,
            weight: 1
        };

        const result = await CreateProduct.receive(context);

        assert(result.data, 'Should return created product data');
        assert(result.data.id, 'Should have product ID');
        assert.strictEqual(result.port, 'out');
    });

    it('should create product with all fields', async function() {
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            this.skip();
        }

        // Generate unique name and SKU to avoid conflicts
        const timestamp = Date.now();
        context.messages.in.content = {
            name: `Test Product Full ${timestamp}`,
            type: 'physical',
            price: 29.99,
            weight: 2,
            sku: `TEST-SKU-${timestamp}`,
            description: 'This is a test product with all fields',
            is_visible: true
        };

        const result = await CreateProduct.receive(context);

        assert(result.data, 'Should return created product data');
        assert(result.data.id, 'Should have product ID');
        assert.strictEqual(result.data.name, context.messages.in.content.name);
        assert.strictEqual(result.port, 'out');
    });

    it('should default is_visible to true when not specified', async function() {
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            this.skip();
        }

        // Generate unique name to avoid conflicts
        const timestamp = Date.now();
        context.messages.in.content = {
            name: `Test Product Visible Default ${timestamp}`,
            type: 'physical',
            price: 19.99,
            weight: 1
        };

        const result = await CreateProduct.receive(context);

        // Verify that the created product has is_visible: true by default
        assert(result.data, 'Should return created product data');
        assert(result.data.id, 'Should have product ID');
        assert.strictEqual(result.data.is_visible, true, 'Product should have is_visible defaulted to true');
        assert.strictEqual(result.port, 'out');
    });
});
