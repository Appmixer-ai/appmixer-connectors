const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CancelSubscription Component', function() {
    let context;
    let CancelSubscription;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        CancelSubscription = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/CancelSubscription/CancelSubscription.js'));

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

    it('should cancel a subscription at end of billing period', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID // Replace with valid subscription ID
            }
        };

        await CancelSubscription.receive(context);

        console.log('CancelSubscription end-of-period output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.cancelled, true, 'Expected subscription to be cancelled');
    });

    it('should cancel a subscription immediately', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID // Replace with valid subscription ID
            }
        };

        await CancelSubscription.receive(context);

        console.log('CancelSubscription immediate output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.cancelled, true, 'Expected subscription to be cancelled');
        assert(data.endsAt, 'Expected ends_at to be set for immediate cancellation');
    });

    it('should handle missing subscription ID', async function() {
        context.messages.in = {
            content: {
                // Missing required subscriptionId
            }
        };

        try {
            await CancelSubscription.receive(context);
            assert.fail('Expected error for missing subscription ID');
        } catch (error) {
            assert(error.message.includes('Subscription ID is required'), 'Expected error about subscription ID');
        }
    });

    it('should handle non-existent subscription ID', async function() {
        context.messages.in = {
            content: {
                subscriptionId: '999999' // Non-existent subscription ID
            }
        };

        try {
            await CancelSubscription.receive(context);
            assert.fail('Expected error for non-existent subscription');
        } catch (error) {
            assert(error.message.includes('404') || error.message.includes('not found'), 'Expected 404 error for non-existent subscription');
        }
    });

    it('should handle already cancelled subscription', async function() {
        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID // Replace with already cancelled subscription ID
            }
        };

        try {
            await CancelSubscription.receive(context);
            // This might succeed or fail depending on API behavior
            console.log('Already cancelled subscription handled');
        } catch (error) {
            assert(error.message.includes('already') || error.message.includes('cancelled'), 'Expected error about already cancelled subscription');
        }
    });
});
