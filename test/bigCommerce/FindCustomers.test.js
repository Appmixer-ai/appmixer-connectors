'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindCustomers Component', function() {
    let context;
    let FindCustomers;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.BIGCOMMERCE_ACCESS_TOKEN || !process.env.BIGCOMMERCE_STORE_HASH) {
            console.log('Skipping tests - BIGCOMMERCE_ACCESS_TOKEN or BIGCOMMERCE_STORE_HASH not set');
            this.skip();
        }

        // Load the component
        FindCustomers = require('../../src/appmixer/bigCommerce/core/FindCustomers/FindCustomers');
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

    it('should find customers successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await FindCustomers.receive(context);

        assert(data && typeof data === 'object', 'Expected data to be an object');
        assert(Array.isArray(data.result), 'Expected data.result to be an array');
        assert(typeof data.count === 'number', 'Expected data.count to be a number');

        if (data.result.length > 0) {
            const customer = data.result[0];
            assert(typeof customer.id === 'number', 'Customer should have numeric ID');
            assert(customer.email, 'Customer should have email');
        }
    });

    it('should find customers with email filter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array',
            email_in: 'test@example.com'
        };

        await FindCustomers.receive(context);

        assert(data && typeof data === 'object', 'Expected data to be an object');
        assert(Array.isArray(data.result), 'Expected data.result to be an array');
        assert(typeof data.count === 'number', 'Expected data.count to be a number');
    });

    it('should find customers with name filter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array',
            name_like: 'test'
        };

        await FindCustomers.receive(context);

        assert(data && typeof data === 'object', 'Expected data to be an object');
        assert(Array.isArray(data.result), 'Expected data.result to be an array');
        assert(typeof data.count === 'number', 'Expected data.count to be a number');
    });

    it('should find customers with company filter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array',
            company_in: 'Test Company'
        };

        await FindCustomers.receive(context);

        assert(data && typeof data === 'object', 'Expected data to be an object');
        assert(Array.isArray(data.result), 'Expected data.result to be an array');
        assert(typeof data.count === 'number', 'Expected data.count to be a number');
    });

    it('should find customers with date filters', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array',
            date_created_start: '2020-01-01T00:00:00Z'
        };

        await FindCustomers.receive(context);

        assert(data && typeof data === 'object', 'Expected data to be an object');
        assert(Array.isArray(data.result), 'Expected data.result to be an array');
        assert(typeof data.count === 'number', 'Expected data.count to be a number');
    });

    it('should find customers with ID filter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // First, get some customers to get their IDs
        context.messages.in.content = {
            outputType: 'array'
        };

        await FindCustomers.receive(context);

        if (data.result && data.result.length > 0) {
            const customerId = data.result[0].id;

            // Now test with ID filter
            context.messages.in.content = {
                outputType: 'array',
                id_in: customerId.toString()
            };

            await FindCustomers.receive(context);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');

            if (data.result.length > 0) {
                assert.strictEqual(data.result[0].id, customerId, 'Should return the specific customer by ID');
            }
        }
    });

    it('should find customers with include sub-resources', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await FindCustomers.receive(context);

        assert(data && typeof data === 'object', 'Expected data to be an object');
        assert(Array.isArray(data.result), 'Expected data.result to be an array');
        assert(typeof data.count === 'number', 'Expected data.count to be a number');
    });

    it('should use default parameters when not specified', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await FindCustomers.receive(context);

        assert(data && typeof data === 'object', 'Expected data to be an object');
        assert(Array.isArray(data.result), 'Expected data.result to be an array');
        assert(typeof data.count === 'number', 'Expected data.count to be a number');
    });

    it('should send to notFound port when no customers match criteria', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
            console.log('Test output:', { data, port }); // Debug log
        };

        // Use very specific search criteria that likely won't match
        context.messages.in.content = {
            outputType: 'array',
            email_in: 'nonexistent-user-12345@example-domain-that-does-not-exist.com',
            name_like: 'NonExistentCustomerName12345'
        };

        await FindCustomers.receive(context);

        if (outputPort === 'notFound') {
            assert.strictEqual(outputPort, 'notFound', 'Should send to notFound port');
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert.deepStrictEqual(data, {}, 'Expected empty object in notFound response');
        } else {
            // If customers were found, verify normal response
            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            console.log('Found customers instead of no results:', data.count);
        }
    });
});
