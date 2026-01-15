const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateSubscription Component', function() {
    let context;
    let UpdateSubscription;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LEMONSQUEEZY_ACCESS_TOKEN) {
            console.log('Skipping tests - LEMONSQUEEZY_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        UpdateSubscription = require(path.join(__dirname, '../../src/appmixer/lemonsqueezy/core/UpdateSubscription/UpdateSubscription.js'));

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

    it('should pause a subscription with void mode successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                pauseMode: 'void',
                pauseResumesAt: '2024-12-31T23:59:59Z'
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription pause void output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert(data.pause, 'Expected pause object to be returned');
    });

    it('should pause a subscription with free mode successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                pauseMode: 'free',
                pauseResumesAt: '2024-12-31T23:59:59Z'
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription pause free output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert(data.pause, 'Expected pause object to be returned');
    });

    it('should cancel a subscription successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                cancelled: true
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription cancel output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.cancelled, true, 'Expected subscription to be cancelled');
    });

    it('should update variant ID successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        const expectedVariantId = parseInt(process.env.LEMONSQUEEZY_VARIANT_ID);
        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                variantId: expectedVariantId
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription variant change output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.variantId, expectedVariantId, 'Expected variant ID to be updated');
    });

    it('should update trial end date successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        const trialEndDate = '2024-12-31T23:59:59Z';
        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                trialEndsAt: trialEndDate
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription trial end output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.trialEndsAt, trialEndDate, 'Expected trial end date to be updated');
    });

    it('should update billing anchor successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                billingAnchor: 15
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription billing anchor output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.billingAnchor, 15, 'Expected billing anchor to be updated');
    });

    it('should update with invoice immediately flag successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                invoiceImmediately: true
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription invoice immediately output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
    });

    it('should update with disable prorations flag successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                disableProrations: true
            }
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription disable prorations output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
    });

    it('should handle missing subscription ID', async function() {
        context.messages.in = {
            content: {
                // Missing required subscriptionId
                cancelled: true
            }
        };

        try {
            await UpdateSubscription.receive(context);
            assert.fail('Expected error for missing subscription ID');
        } catch (error) {
            assert(error.message.includes('Subscription ID is required'), 'Expected error about subscription ID');
        }
    });

    it('should handle pause mode without resume date', async function() {
        context.messages.in = {
            content: {
                subscriptionId: process.env.LEMONSQUEEZY_SUBSCRIPTION_ID,
                pauseMode: 'void'
                // Missing pauseResumesAt
            }
        };

        try {
            await UpdateSubscription.receive(context);
            assert.fail('Expected error for missing pause resume date');
        } catch (error) {
            assert(error.message.includes('Pause Resumes At date is required'), 'Expected error about pause resume date');
        }
    });

    it('should handle non-existent subscription ID', async function() {
        context.messages.in = {
            content: {
                subscriptionId: '999999', // Non-existent subscription ID
                cancelled: true
            }
        };

        try {
            await UpdateSubscription.receive(context);
            assert.fail('Expected error for non-existent subscription');
        } catch (error) {
            assert(error.message.includes('404') || error.message.includes('not found'), 'Expected 404 error for non-existent subscription');
        }
    });
});
