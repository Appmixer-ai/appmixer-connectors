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

    it('should pause a subscription successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            subscriptionId: '1', // Replace with valid subscription ID
            paused: true
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription pause output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.paused, true, 'Expected subscription to be paused');
    });

    it('should unpause a subscription successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            subscriptionId: '1', // Replace with valid subscription ID
            paused: false
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription unpause output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.paused, false, 'Expected subscription to be unpaused');
    });

    it('should update billing anchor successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            subscriptionId: '1', // Replace with valid subscription ID
            billingAnchor: 15,
            proration: true
        };

        await UpdateSubscription.receive(context);

        console.log('UpdateSubscription billing anchor output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(data.id, 'Expected subscription ID to be returned');
        assert.strictEqual(data.billingAnchor, 15, 'Expected billing anchor to be updated');
    });

    it('should handle missing subscription ID', async function() {
        context.messages.in = {
            // Missing required subscriptionId
            paused: true
        };

        try {
            await UpdateSubscription.receive(context);
            assert.fail('Expected error for missing subscription ID');
        } catch (error) {
            assert(error.message.includes('subscription') || error.message.includes('ID'), 'Expected error about subscription ID');
        }
    });

    it('should handle non-existent subscription ID', async function() {
        context.messages.in = {
            subscriptionId: '999999', // Non-existent subscription ID
            paused: true
        };

        try {
            await UpdateSubscription.receive(context);
            assert.fail('Expected error for non-existent subscription');
        } catch (error) {
            assert(error.message.includes('404') || error.message.includes('not found'), 'Expected 404 error for non-existent subscription');
        }
    });
});
