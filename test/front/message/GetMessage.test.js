'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('GetMessage Component', function() {
    let context;
    let GetMessage;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            this.skip();
            return;
        }

        GetMessage = require('../../../src/appmixer/front/message/GetMessage/GetMessage.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/message/GetMessage/component.json');

            assert(typeof GetMessage.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.message.GetMessage', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });

    describe('Input Validation', function() {
        it('should require message ID', async function() {
            context.messages = { in: { content: {} } };

            try {
                await GetMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Message ID is required'), 'Should require message ID');
            }
        });

        it('should accept valid message ID with mock response', async function() {
            context.messages = {
                in: {
                    content: {
                        id: 'msg_123'
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => ({
                data: {
                    id: 'msg_123',
                    type: 'email',
                    is_inbound: true,
                    is_draft: false,
                    subject: 'Test Message',
                    body: '<p>Test body</p>',
                    text: 'Test body',
                    created_at: Date.now()
                }
            });

            await GetMessage.receive(context);
            assert(context.lastSent.data.id === 'msg_123', 'Result should have correct id');
            assert(context.lastSent.data.subject === 'Test Message', 'Result should have correct subject');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });

    describe('API Integration', function() {
        it('should handle API errors gracefully', async function() {
            // Mock error response  
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => {
                const error = new Error('Message not found');
                error.response = { status: 404 };
                throw error;
            };

            context.messages = {
                in: {
                    content: {
                        id: 'invalid_message_id'
                    }
                }
            };

            try {
                await GetMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof Error, 'Should throw an error');
            }

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });
});
