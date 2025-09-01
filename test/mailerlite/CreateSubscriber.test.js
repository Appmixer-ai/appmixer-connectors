'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('CreateSubscriber Component', function() {

    this.timeout(30000);
    let context;
    let CreateSubscriber;

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.MAILERLITE_API_KEY) {
            console.log('Skipping tests - MAILERLITE_API_KEY not set');
            this.skip();
        }

        // Load the component
        CreateSubscriber = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/CreateSubscriber/CreateSubscriber.js'));
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

    it('should create a subscriber with email only', async function() {
        const timestamp = Date.now();
        context.messages.in.content = {
            email: `test${timestamp}@example.com`
        };

        await CreateSubscriber.receive(context);

        assert.ok(context.sendJson.calledOnce);
        const [output, outputPort] = context.sendJson.firstCall.args;
        assert.strictEqual(outputPort, 'out');
        assert.strictEqual(typeof output, 'object');
        assert.strictEqual(output.email, `test${timestamp}@example.com`);
        assert.ok(output.id);
    });

    it('should create a subscriber with email and name', async function() {
        const timestamp = Date.now();
        context.messages.in.content = {
            email: `test${timestamp}@example.com`,
            name: 'Test User'
        };

        await CreateSubscriber.receive(context);

        assert.ok(context.sendJson.calledOnce);
        const [output, outputPort] = context.sendJson.firstCall.args;
        assert.strictEqual(outputPort, 'out');
        assert.strictEqual(typeof output, 'object');
        assert.strictEqual(output.email, `test${timestamp}@example.com`);
        assert.ok(output.id);
        if (output.fields && output.fields.name) {
            assert.strictEqual(output.fields.name, 'Test User');
        }
    });

    it('should throw error when email is missing', async function() {
        context.messages.in.content = {
            name: 'Test User'
        };

        let error;
        try {
            await CreateSubscriber.receive(context);
        } catch (err) {
            error = err;
        }

        assert.ok(error);
        assert.strictEqual(error.message, 'Email is required!');
        assert.ok(!context.sendJson.called);
    });
});
