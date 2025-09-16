'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('DeleteCustomer Component', function() {
    let context;
    let DeleteCustomer;
    let CreateCustomer;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the components
        DeleteCustomer = require('../../src/appmixer/bigCommerce/core/DeleteCustomer/DeleteCustomer');
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

    it('should require customer_id', async function() {
        context.messages.in.content = {};

        try {
            await DeleteCustomer.receive(context);
            assert.fail('Should have thrown error for missing customer_id');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Customer ID is required!');
        }
    });

    it('should delete a customer successfully', async function() {
        // First, create a customer to delete
        const timestamp = Date.now();
        context.messages.in.content = {
            email: `test_delete_${timestamp}@example.com`,
            first_name: 'TestDelete',
            last_name: 'Customer'
        };

        const createResult = await CreateCustomer.receive(context);
        assert(createResult.data, 'Should create customer');
        assert(createResult.data.id, 'Should have customer ID');

        const customerId = createResult.data.id;

        // Now delete the created customer
        context.messages.in.content = {
            customer_id: customerId
        };

        const deleteResult = await DeleteCustomer.receive(context);

        assert.deepStrictEqual(deleteResult, {
            data: {},
            port: 'out'
        });

        // Verify the customer is deleted by trying to get it (should fail)
        const GetCustomer = require('../../src/appmixer/bigCommerce/core/GetCustomer/GetCustomer');
        context.messages.in.content = {
            customer_id: customerId
        };

        try {
            await GetCustomer.receive(context);
            assert.fail('Customer should have been deleted');
        } catch (error) {
            // Expected - customer should not exist anymore
            assert(error instanceof context.CancelError, 'Should throw CancelError for deleted customer');
            assert.strictEqual(error.message, 'Customer not found.', 'Should return customer not found error');
        }
    });
});
