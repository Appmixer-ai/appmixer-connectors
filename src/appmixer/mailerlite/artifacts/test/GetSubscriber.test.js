'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('GetSubscriber Component', function() {

    this.timeout(30000);
    let context;
    let GetSubscriber;

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.MAILERLITE_API_KEY) {
            console.log('Skipping tests - MAILERLITE_API_KEY not set');
            this.skip();
        }

        // Load the component
        GetSubscriber = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/GetSubscriber/GetSubscriber.js'));
    });

    beforeEach(function() {
        // Mock context
        context = {
            auth: {
                apiKey: process.env.MAILERLITE_API_KEY
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: require('axios'),
            sendJson: sinon.stub(),
            log: sinon.stub(),
            CancelError: Error
        };
    });

    it('should get subscriber by ID', async function() {

        context.messages.in.content = {
            subscriberId: process.env.MAILERLITE_SUBSCRIBER_ID
        };

        await GetSubscriber.receive(context);

        // Check that sendJson was called
        assert(context.sendJson.calledOnce, 'sendJson should be called once');

        const [data, port] = context.sendJson.firstCall.args;

        // Should send to 'out' port
        assert.strictEqual(port, 'out', 'Should send to out port');

        // Data should be an object (single subscriber)
        assert.strictEqual(typeof data, 'object', 'Data should be an object');
        assert(!Array.isArray(data), 'Data should not be an array');

        // Should have expected properties
        assert(data.id, 'Should have id property');
        assert(data.email, 'Should have email property');

        console.log('Found subscriber:', data.email);
    });

    it('should throw error when neither ID nor email provided', async function() {

        context.messages.in.content = {};

        try {
            await GetSubscriber.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('required'), 'Should throw error about required fields');
            console.log('Correctly handled missing parameters:', error.message);
        }
    });
});
