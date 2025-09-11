'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateCustomer Component', function() {
    let context;
    let CreateCustomer;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        CreateCustomer = require('../../src/appmixer/bigCommerce/core/CreateCustomer/CreateCustomer');
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

    it('should require email', async function() {
        context.messages.in.content = {
            first_name: 'Test',
            last_name: 'Customer'
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown error for missing email');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Email is required!');
        }
    });

    it('should require first_name', async function() {
        context.messages.in.content = {
            email: `test_${Date.now()}@example.com`,
            last_name: 'Customer'
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown error for missing first_name');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'First name is required!');
        }
    });

    it('should require last_name', async function() {
        context.messages.in.content = {
            email: `test_${Date.now()}@example.com`,
            first_name: 'Test'
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown error for missing last_name');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Last name is required!');
        }
    });

    it('should create a customer successfully', async function() {
        context.messages.in.content = {
            email: `test_create_${Date.now()}@example.com`,
            first_name: 'Test',
            last_name: 'Customer'
        };

        const result = await CreateCustomer.receive(context);

        assert(result.data, 'Should return created customer data');
        assert(result.data.id, 'Should have customer ID');
        assert.strictEqual(result.data.email, context.messages.in.content.email);
        assert.strictEqual(result.port, 'out');
    });

    it('should create customer with minimal data', async function() {
        context.messages.in.content = {
            email: `test_minimal_${Date.now()}@example.com`,
            first_name: 'Test',
            last_name: 'Customer'  // Adding last_name as BigCommerce may require both first and last name
        };

        const result = await CreateCustomer.receive(context);

        assert(result.data, 'Should return created customer data');
        assert(result.data.id, 'Should have customer ID');
        assert.strictEqual(result.data.email, context.messages.in.content.email);
        assert.strictEqual(result.port, 'out');
    });

    it('should require street_1 when providing address fields', async function() {
        context.messages.in.content = {
            email: `test_${Date.now()}@example.com`,
            first_name: 'Test',
            last_name: 'Customer',
            address_city: 'New York'
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown error for missing street_1');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Address street 1 is required when providing address information!');
        }
    });

    it('should require city when providing address fields', async function() {
        context.messages.in.content = {
            email: `test_${Date.now()}@example.com`,
            first_name: 'Test',
            last_name: 'Customer',
            address_street_1: '123 Main St'
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown error for missing city');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Address city is required when providing address information!');
        }
    });

    it('should require country when providing address fields', async function() {
        context.messages.in.content = {
            email: `test_${Date.now()}@example.com`,
            first_name: 'Test',
            last_name: 'Customer',
            address_street_1: '123 Main St',
            address_city: 'New York'
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Should have thrown error for missing country');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Address country is required when providing address information!');
        }
    });

    it('should create customer with complete address', async function() {
        context.messages.in.content = {
            email: `test_address_${Date.now()}@example.com`,
            first_name: 'Test',
            last_name: 'Customer',
            phone: '+1234567890',
            address_street_1: '123 Main St',
            address_city: 'New York',
            address_state: 'New York',
            address_zip: '10001',
            address_country: 'US',
            company: 'Test Company'
        };

        const result = await CreateCustomer.receive(context);

        assert(result.data, 'Should return created customer data');
        assert(result.data.id, 'Should have customer ID');
        assert.strictEqual(result.data.email, context.messages.in.content.email);
        assert.strictEqual(result.port, 'out');
    });
});
