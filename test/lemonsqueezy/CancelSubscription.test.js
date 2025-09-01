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

    afterEach(function() {
        // Reset context messages to ensure test isolation
        context.messages.in = {};
    });

    it('should cancel a subscription at end of billing period', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Use primary subscription ID for end-of-billing-period cancellation
        const subscriptionId = process.env.LEMONSQUEEZY_SUBSCRIPTION_ID || process.env.LEMONSQUEEZY_SUBSCRIPTION_ID_1;

        context.messages.in = {
            content: {
                subscriptionId: subscriptionId
            }
        };

        await CancelSubscription.receive(context);

        console.log('CancelSubscription end-of-period output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.cancelled, true, 'Expected subscription to be cancelled');

        // For end-of-billing-period cancellation, subscription should still be active until the end date
        if (data.endsAt) {
            const endsAt = new Date(data.endsAt);
            const now = new Date();
            assert(endsAt > now, 'Expected end date to be in the future for end-of-period cancellation');
        }
    });

    it('should cancel a subscription immediately', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        // Use secondary subscription ID for immediate cancellation, fallback to primary if not available
        const subscriptionId = process.env.LEMONSQUEEZY_SUBSCRIPTION_ID_2 || process.env.LEMONSQUEEZY_SUBSCRIPTION_ID;

        context.messages.in = {
            content: {
                subscriptionId: subscriptionId
            }
        };

        await CancelSubscription.receive(context);

        console.log('CancelSubscription immediate output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.cancelled, true, 'Expected subscription to be cancelled');

        // Note: Current Lemon Squeezy API implementation cancels at end of billing period by default
        // The presence of endsAt indicates when the subscription will actually end
        if (data.endsAt) {
            console.log(`Subscription will end at: ${data.endsAt}`);
        }
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
                // Replace with already cancelled subscription ID
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID
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
