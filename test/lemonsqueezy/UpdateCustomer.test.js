const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateCustomer Component', function() {
    let context;
    let UpdateCustomer;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        UpdateCustomer = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/UpdateCustomer/UpdateCustomer.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.LEMONSQUEEZY_ACCESS_TOKEN
            },
            messages: {
                in: {}
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

        assert(context.auth.apiKey, 'LEMONSQUEEZY_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should update a customer successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                customerId: '1', // Replace with valid customer ID
                name: 'Updated Customer Name',
                email: `updated-${Date.now()}@example.com`,
                city: 'Updated City',
                region: 'Updated Region',
                country: 'CA'
            }
        };

        await UpdateCustomer.receive(context);

        console.log('UpdateCustomer output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected customer ID to be returned');
        assert.strictEqual(data.name, 'Updated Customer Name', 'Expected name to be updated');
    });

    it('should handle missing customer ID', async function() {
        context.messages.in = {
            content: {
                // Missing required customerId
                name: 'Test Customer',
                email: 'test@example.com'
            }
        };

        try {
            await UpdateCustomer.receive(context);
            assert.fail('Expected error for missing customer ID');
        } catch (error) {
            assert(error.message.includes('customer') || error.message.includes('ID'), 'Expected error about customer ID');
        }
    });

    it('should handle non-existent customer ID', async function() {
        context.messages.in = {
            content: {
                customerId: '999999', // Non-existent customer ID
                name: 'Test Customer'
            }
        };

        try {
            await UpdateCustomer.receive(context);
            assert.fail('Expected error for non-existent customer');
        } catch (error) {
            assert(error.message.includes('404') || error.message.includes('not found'), 'Expected 404 error for non-existent customer');
        }
    });
});
