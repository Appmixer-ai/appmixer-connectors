'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateCustomer Component', function() {
    let context;
    let UpdateCustomer;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        UpdateCustomer = require('../../src/appmixer/bigCommerce/core/UpdateCustomer/UpdateCustomer');
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

    it('should require customer_id', async function() {
        context.messages.in.content = {
            first_name: 'Updated Name'
        };

        try {
            await UpdateCustomer.receive(context);
            assert.fail('Should have thrown error for missing customer_id');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert.strictEqual(error.message, 'Customer ID is required!');
        }
    });

    it('should update a customer successfully', async function() {
        // First, create a customer to update
        const createResponse = await context.httpRequest({
            method: 'POST',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: [{
                email: `test_update_${Date.now()}@example.com`,
                first_name: 'TestFirst',
                last_name: 'TestLast'
            }]
        });

        assert(Array.isArray(createResponse.data.data), 'Should return created customers array');
        assert(createResponse.data.data.length > 0, 'Should have created at least one customer');
        const createdCustomer = createResponse.data.data[0];

        context.messages.in.content = {
            customer_id: createdCustomer.id,
            first_name: `Updated ${Date.now()}`,
            last_name: 'UpdatedLastName'
        };

        const result = await UpdateCustomer.receive(context);

        assert.deepStrictEqual(result, {
            data: {},
            port: 'out'
        });
    });

    it('should update only provided fields', async function() {
        // First, create a customer to update
        const createResponse = await context.httpRequest({
            method: 'POST',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: [{
                email: `test_partial_update_${Date.now()}@example.com`,
                first_name: 'TestFirst',
                last_name: 'TestLast'
            }]
        });

        assert(Array.isArray(createResponse.data.data), 'Should return created customers array');
        assert(createResponse.data.data.length > 0, 'Should have created at least one customer');
        const createdCustomer = createResponse.data.data[0];

        context.messages.in.content = {
            customer_id: createdCustomer.id,
            first_name: `OnlyFirstName ${Date.now()}`
            // Only providing first_name, not last_name or other fields
        };

        const result = await UpdateCustomer.receive(context);

        assert.deepStrictEqual(result, {
            data: {},
            port: 'out'
        });
    });
});
