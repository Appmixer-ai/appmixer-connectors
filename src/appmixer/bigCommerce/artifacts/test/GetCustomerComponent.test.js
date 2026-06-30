'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetCustomer Component', function() {
    let context;
    let GetCustomer;
    let validCustomerId;

    this.timeout(30000);

    before(async function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        GetCustomer = require(path.join(__dirname, '../../src/appmixer/bigCommerce/core/GetCustomer/GetCustomer.js'));

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

        // First, find a valid customer ID by listing customers
        const customersResponse = await context.httpRequest({
            method: 'GET',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken,
                'Accept': 'application/json'
            },
            params: { limit: 1 }
        });

        if (customersResponse.data.data && customersResponse.data.data.length > 0) {
            validCustomerId = customersResponse.data.data[0].id;
            console.log(`Found valid customer ID: ${validCustomerId}`);
        } else {
            console.log('No customers found in store - skipping tests');
            this.skip();
        }

        assert(context.auth.accessToken, 'BIGCOMMERCE_ACCESS_TOKEN environment variable is required for tests');
        assert(context.auth.storeHash, 'BIGCOMMERCE_STORE_HASH environment variable is required for tests');
    });

    it('should get a customer by ID', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            customer_id: validCustomerId
        };

        try {
            await GetCustomer.receive(context);

            console.log('GetCustomer result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'number', 'Customer should have numeric ID');
            assert(typeof data.email === 'string', 'Customer should have email string');
            assert.strictEqual(data.id, validCustomerId, 'Returned customer should have correct ID');
        } catch (error) {
            console.error('GetCustomer test error:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    });

    it('should throw error for missing customer ID', async function() {
        context.messages.in.content = {}; // No customer_id

        try {
            await GetCustomer.receive(context);
            assert.fail('Should have thrown an error for missing customer ID');
        } catch (error) {
            assert(error.message.includes('Customer ID is required'), 'Should throw correct error message');
        }
    });
});
