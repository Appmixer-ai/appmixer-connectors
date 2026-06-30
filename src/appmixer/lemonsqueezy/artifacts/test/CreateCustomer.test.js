const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateCustomer Component', function() {
    let context;
    let CreateCustomer;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        CreateCustomer = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/CreateCustomer/CreateCustomer.js'));

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

    it('should create a customer successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                storeId: process.env.LEMONSQUEEZY_STORE_ID, // Use real store ID
                name: 'Test Customer',
                email: `test-${Date.now()}@example.com`,
                city: 'Test City',
                region: 'Test Region',
                country: 'US'
            }
        };

        await CreateCustomer.receive(context);

        console.log('CreateCustomer output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected customer ID to be returned');
        assert.strictEqual(data.name, 'Test Customer', 'Expected name to match');
        assert(data.email.includes('test-'), 'Expected email to contain test prefix');
    });

    it('should handle missing required fields', async function() {
        context.messages.in = {
            content: {
                // Missing required storeId
                name: 'Test Customer',
                email: 'test@example.com'
            }
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Expected error for missing store ID');
        } catch (error) {
            assert(error.message.includes('store'), 'Expected error about store');
        }
    });

    it('should handle invalid email format', async function() {
        context.messages.in = {
            content: {
                storeId: process.env.LEMONSQUEEZY_STORE_ID,
                name: 'Test Customer',
                email: 'invalid-email'
            }
        };

        try {
            await CreateCustomer.receive(context);
            assert.fail('Expected error for invalid email');
        } catch (error) {
            assert(error.message.includes('email') || error.message.includes('valid'), 'Expected error about email format');
        }
    });
});
