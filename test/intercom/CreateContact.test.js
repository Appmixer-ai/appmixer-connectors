const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createMockContext } = require('../utils');
const httpRequest = require('./httpRequest');
const component = require('../../src/appmixer/intercom/core/CreateContact/CreateContact');

// Make createMockContext available globally
global.createMockContext = createMockContext;

describe('Intercom CreateContact Component', function() {

    let context;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    beforeEach(() => {
        context = global.createMockContext({
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            httpRequest: httpRequest
        });
    });

    it('should create a contact with email only', async () => {
        const randomEmail = `test${Date.now()}@example.com`;

        context.messages = {
            in: {
                content: {
                    email: randomEmail
                }
            }
        };

        await component.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const result = context.sendJson.firstCall.args[0];
        assert(result.id, 'Should return contact id');
        assert.strictEqual(result.email, randomEmail, 'Should return correct email');
    });

    it('should create a contact with email and name', async () => {
        const randomEmail = `test${Date.now()}@example.com`;

        context.messages = {
            in: {
                content: {
                    email: randomEmail,
                    name: 'Test User'
                }
            }
        };

        await component.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const result = context.sendJson.firstCall.args[0];
        assert(result.id, 'Should return contact id');
        assert.strictEqual(result.email, randomEmail, 'Should return correct email');
        assert.strictEqual(result.name, 'Test User', 'Should return correct name');
    });

    it('should throw error when email is missing', async () => {
        context.messages = {
            in: {
                content: {
                    name: 'Test User'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Email is required'), 'Should mention email is required');
        }
    });
});
