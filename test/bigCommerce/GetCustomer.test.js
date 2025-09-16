'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetCustomer Component', function() {
    let context;
    let GetCustomer;
    let CreateCustomer;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the components
        GetCustomer = require('../../src/appmixer/bigCommerce/core/GetCustomer/GetCustomer');
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
            await GetCustomer.receive(context);
            assert.fail('Should have thrown error for missing customer_id');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Customer ID is required!');
        }
    });

    it('should get a customer successfully', async function() {
        // First, create a customer to get
        context.messages.in.content = {
            email: `test_get_${Date.now()}@example.com`,
            first_name: 'TestGet',
            last_name: 'Customer'
        };

        const createResult = await CreateCustomer.receive(context);
        assert(createResult.data.id, 'Should create customer with ID');

        const customerId = createResult.data.id;

        // Now get the customer
        context.messages.in.content = {
            customer_id: customerId
        };

        const getResult = await GetCustomer.receive(context);

        assert(getResult.data, 'Should return customer data');
        assert.strictEqual(getResult.data.id, customerId);
        assert.strictEqual(getResult.port, 'out');
    });
});
