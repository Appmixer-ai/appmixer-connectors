'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('ReplyMessage Component', function() {
    let context;
    let ReplyMessage;

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

        ReplyMessage = require('../../../src/appmixer/front/message/ReplyMessage/ReplyMessage.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/message/ReplyMessage/component.json');

            assert(typeof ReplyMessage.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.message.ReplyMessage', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });

    describe('Input Validation', function() {
        it('should require conversation ID', async function() {
            context.messages = { in: { content: {} } };

            try {
                await ReplyMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Conversation ID is required'), 'Should require conversation ID');
            }
        });

        it('should require message body or text', async function() {
            context.messages = {
                in: {
                    content: {
                        conversation_id: 'cnv_123'
                    }
                }
            };

            try {
                await ReplyMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Message body or text is required'), 'Should require body or text');
            }
        });

        it('should accept valid reply data with mock response', async function() {
            context.messages = {
                in: {
                    content: {
                        conversation_id: 'cnv_123',
                        body: '<p>Reply body</p>',
                        to: 'recipient@example.com',
                        reply_all: true
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async (options) => {
                // Verify the request data is properly formatted
                assert(Array.isArray(options.data.to), 'To should be an array when provided as string');
                assert(options.data.body === '<p>Reply body</p>', 'Should include body');
                assert(options.data.options.reply_all === true, 'Should include reply_all option');

                return {
                    data: {
                        id: 'msg_456',
                        type: 'email',
                        is_inbound: false,
                        is_draft: false,
                        body: '<p>Reply body</p>',
                        created_at: Date.now()
                    }
                };
            };

            await ReplyMessage.receive(context);
            assert(context.lastSent.data.id === 'msg_456', 'Result should have correct id');
            assert(context.lastSent.data.body === '<p>Reply body</p>', 'Result should have correct body');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });

        it('should handle minimal reply with just body', async function() {
            context.messages = {
                in: {
                    content: {
                        conversation_id: 'cnv_123',
                        text: 'Simple text reply'
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async (options) => {
                // Verify minimal data structure
                assert(options.data.text === 'Simple text reply', 'Should include text');
                assert(!options.data.to, 'Should not include to field when not provided');
                assert(!options.data.options, 'Should not include options when reply_all not specified');

                return {
                    data: {
                        id: 'msg_789',
                        text: 'Simple text reply',
                        created_at: Date.now()
                    }
                };
            };

            await ReplyMessage.receive(context);
            assert(context.lastSent.data.id === 'msg_789', 'Result should have correct id');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });

        it('should handle array inputs correctly', async function() {
            context.messages = {
                in: {
                    content: {
                        conversation_id: 'cnv_123',
                        to: ['test@example.com', 'test2@example.com'],
                        cc: ['cc@example.com'],
                        body: 'Test reply body',
                        attachments: ['file_123']
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async (options) => {
                // Verify arrays are passed through correctly
                assert(Array.isArray(options.data.to), 'To should be an array');
                assert(Array.isArray(options.data.cc), 'CC should be an array');
                assert(Array.isArray(options.data.attachments), 'Attachments should be an array');

                return {
                    data: {
                        id: 'msg_101',
                        body: 'Test reply body',
                        created_at: Date.now()
                    }
                };
            };

            await ReplyMessage.receive(context);
            assert(context.lastSent.data.id === 'msg_101', 'Result should have correct id');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });

    describe('API Integration', function() {
        it('should handle API errors gracefully', async function() {
            // Mock error response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => {
                const error = new Error('Conversation not found');
                error.response = { status: 404 };
                throw error;
            };

            context.messages = {
                in: {
                    content: {
                        conversation_id: 'invalid_conversation_id',
                        body: 'Test reply'
                    }
                }
            };

            try {
                await ReplyMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof Error, 'Should throw an error');
            }

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });
});
