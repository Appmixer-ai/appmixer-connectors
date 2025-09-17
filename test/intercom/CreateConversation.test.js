const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createMockContext } = require('../utils');
const httpRequest = require('./httpRequest');
const component = require('../../src/appmixer/intercom/core/CreateConversation/CreateConversation');

// Make createMockContext available globally
global.createMockContext = createMockContext;

describe('Intercom CreateConversation Component', function() {

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

    it('should require contact_id', async () => {
        context.messages = {
            in: {
                content: {
                    body: 'Test message'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Contact ID is required'), 'Should mention contact ID is required');
        }
    });

    it('should require body', async () => {
        context.messages = {
            in: {
                content: {
                    contact_id: '12345'
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Message body is required'), 'Should mention body is required');
        }
    });
});
