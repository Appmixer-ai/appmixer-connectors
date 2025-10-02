'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('CreateMessage Component', function() {
    let context;
    let CreateMessage;

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

        CreateMessage = require('../../../src/appmixer/front/message/CreateMessage/CreateMessage.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/message/CreateMessage/component.json');

            assert(typeof CreateMessage.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.message.CreateMessage', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });

    describe('Input Validation', function() {
        it('should require channel ID', async function() {
            context.messages = { in: { content: {} } };

            try {
                await CreateMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Channel ID is required'), 'Should require channel ID');
            }
        });

        it('should require recipients', async function() {
            context.messages = {
                in: {
                    content: {
                        channel_id: 'cha_123'
                    }
                }
            };

            try {
                await CreateMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Recipients (to) are required'), 'Should require recipients');
            }
        });

        it('should require message body or text', async function() {
            context.messages = {
                in: {
                    content: {
                        channel_id: 'cha_123',
                        to: ['test@example.com']
                    }
                }
            };

            try {
                await CreateMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Message body or text is required'), 'Should require body or text');
            }
        });

        it('should accept valid message data with mock response', async function() {
            context.messages = {
                in: {
                    content: {
                        channel_id: 'cha_123',
                        to: 'test@example.com, test2@example.com',
                        cc: 'cc@example.com',
                        subject: 'Test Message',
                        body: '<p>Test body</p>',
                        author_id: 'tea_123'
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async (options) => {
                // Verify the request data is properly formatted
                assert(Array.isArray(options.data.to), 'To should be an array');
                assert(options.data.to.includes('test@example.com'), 'Should include first recipient');
                assert(options.data.to.includes('test2@example.com'), 'Should include second recipient');
                assert(Array.isArray(options.data.cc), 'CC should be an array');
                assert(options.data.subject === 'Test Message', 'Should include subject');
                assert(options.data.body === '<p>Test body</p>', 'Should include body');

                return {
                    data: {
                        id: 'msg_123',
                        type: 'email',
                        is_inbound: false,
                        is_draft: false,
                        subject: 'Test Message',
                        body: '<p>Test body</p>',
                        created_at: Date.now()
                    }
                };
            };

            await CreateMessage.receive(context);
            assert(context.lastSent.data.id === 'msg_123', 'Result should have correct id');
            assert(context.lastSent.data.subject === 'Test Message', 'Result should have correct subject');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });

        it('should handle array inputs correctly', async function() {
            context.messages = {
                in: {
                    content: {
                        channel_id: 'cha_123',
                        to: ['test@example.com', 'test2@example.com'],
                        cc: ['cc@example.com'],
                        body: 'Test body',
                        attachments: ['file_123', 'file_456']
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
                        id: 'msg_123',
                        body: 'Test body',
                        created_at: Date.now()
                    }
                };
            };

            await CreateMessage.receive(context);
            assert(context.lastSent.data.id === 'msg_123', 'Result should have correct id');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });

    describe('API Integration', function() {
        it('should handle API errors gracefully', async function() {
            // Mock error response  
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => {
                const error = new Error('Channel not found');
                error.response = { status: 404 };
                throw error;
            };

            context.messages = {
                in: {
                    content: {
                        channel_id: 'invalid_channel_id',
                        to: ['test@example.com'],
                        body: 'Test body'
                    }
                }
            };

            try {
                await CreateMessage.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof Error, 'Should throw an error');
            }

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });
});
