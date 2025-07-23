const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GenerateOrderInvoice Component', function() {
    let context;
    let GenerateOrderInvoice;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        GenerateOrderInvoice = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/GenerateOrderInvoice/GenerateOrderInvoice.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.LEMONSQUEEZY_ACCESS_TOKEN
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

        assert(context.auth.accessToken, 'LEMONSQUEEZY_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should generate an order invoice successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            orderId: '1' // Replace with valid order ID
        };

        await GenerateOrderInvoice.receive(context);

        console.log('GenerateOrderInvoice output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.orderId, 'Expected order ID to be returned');
        assert(data.invoiceUrl || data.invoiceNumber, 'Expected invoice URL or number to be returned');
    });

    it('should handle missing order ID', async function() {
        context.messages.in = {
            // Missing required orderId
        };

        try {
            await GenerateOrderInvoice.receive(context);
            assert.fail('Expected error for missing order ID');
        } catch (error) {
            assert(error.message.includes('order') || error.message.includes('ID'), 'Expected error about order ID');
        }
    });

    it('should handle non-existent order ID', async function() {
        context.messages.in = {
            orderId: '999999' // Non-existent order ID
        };

        try {
            await GenerateOrderInvoice.receive(context);
            assert.fail('Expected error for non-existent order');
        } catch (error) {
            assert(error.message.includes('404') || error.message.includes('not found'), 'Expected 404 error for non-existent order');
        }
    });
});
