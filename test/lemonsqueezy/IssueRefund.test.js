const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('IssueRefund Component', function() {
    let context;
    let IssueRefund;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        IssueRefund = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/IssueRefund/IssueRefund.js'));

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

    it('should issue a full refund successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                orderId: process.env.LEMONSQUEEZY_ORDER_ID, // Use real order ID
                reason: 'Test refund'
            }
        };

        await IssueRefund.receive(context);

        console.log('IssueRefund output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected refund ID to be returned');
        assert(data.orderId, 'Expected order ID to be returned');
        assert(data.amount, 'Expected refund amount to be returned');
    });

    it('should issue a partial refund successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                orderId: process.env.LEMONSQUEEZY_ORDER_ID, // Use real order ID
                amount: 10.00,
                reason: 'Partial refund test'
            }
        };

        await IssueRefund.receive(context);

        console.log('IssueRefund partial output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected refund ID to be returned');
        assert.strictEqual(data.amount, 10.00, 'Expected partial refund amount');
    });

    it('should handle missing order ID', async function() {
        context.messages.in = {
            content: {
                // Missing required orderId
                amount: 10.00
            }
        };

        try {
            await IssueRefund.receive(context);
            assert.fail('Expected error for missing order ID');
        } catch (error) {
            assert(error.message.includes('order') || error.message.includes('ID'), 'Expected error about order ID');
        }
    });

    it('should handle non-existent order ID', async function() {
        context.messages.in = {
            content: {
                orderId: '999999' // Non-existent order ID
            }
        };

        try {
            await IssueRefund.receive(context);
            assert.fail('Expected error for non-existent order');
        } catch (error) {
            assert(error.message.includes('404') || error.message.includes('not found'), 'Expected 404 error for non-existent order');
        }
    });
});
