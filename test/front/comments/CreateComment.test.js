'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('CreateComment Component', function() {
    let context;
    let CreateComment;
    let testConversationId;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            console.log('Skipping tests - FRONT_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        CreateComment = require(path.join(__dirname, '../../../src/appmixer/front/comments/CreateComment/CreateComment.js'));

        // Set up test conversation ID
        testConversationId = process.env.FRONT_TEST_CONVERSATION_ID || 'cnv_test';

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof CreateComment, 'object');
            assert.strictEqual(typeof CreateComment.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing conversationId', async function() {
            context.messages.in = {
                content: {
                    body: 'Test comment without conversation ID'
                }
            };

            try {
                await CreateComment.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Conversation ID is required.');
            }
        });

        it('should throw CancelError for missing body', async function() {
            context.messages.in = {
                content: {
                    conversationId: testConversationId
                }
            };

            try {
                await CreateComment.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Comment body is required.');
            }
        });
    });

    describe('API Integration', function() {
        it('should create a comment successfully', async function() {
            if (!testConversationId.startsWith('cnv_')) {
                this.skip('No valid test conversation ID provided');
            }

            const testMessage = `Test comment created at ${new Date().toISOString()}`;
            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    body: testMessage
                }
            };

            try {
                await CreateComment.receive(context);

                assert.ok(context.lastSent, 'Component should have sent output');
                assert.strictEqual(context.lastSent.outputPort, 'out');

                const result = context.lastSent.data;
                assert.ok(result.id, 'Result should have an ID');
                assert.strictEqual(result.body, testMessage);
                assert.ok(result.created_at, 'Result should have creation timestamp');

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping integration test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should include author_id when provided', async function() {
            if (!testConversationId.startsWith('cnv_')) {
                this.skip('No valid test conversation ID provided');
            }

            const testMessage = `Test comment with author at ${new Date().toISOString()}`;
            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    body: testMessage,
                    author_id: 'usr_test'
                }
            };

            try {
                await CreateComment.receive(context);

                assert.ok(context.lastSent, 'Component should have sent output');
                const result = context.lastSent.data;
                assert.strictEqual(result.body, testMessage);

            } catch (error) {
                if (error.response && (error.response.status === 404 || error.response.status === 422)) {
                    console.log('Test conversation or author not found - skipping test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should create a pinned comment successfully', async function() {
            if (!testConversationId.startsWith('cnv_')) {
                this.skip('No valid test conversation ID provided');
            }

            const testMessage = `Test pinned comment created at ${new Date().toISOString()}`;
            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    body: testMessage,
                    is_pinned: true
                }
            };

            try {
                await CreateComment.receive(context);

                assert.ok(context.lastSent, 'Component should have sent output');
                assert.strictEqual(context.lastSent.outputPort, 'out');

                const result = context.lastSent.data;
                assert.ok(result.id, 'Result should have an ID');
                assert.strictEqual(result.body, testMessage);
                assert.strictEqual(result.is_pinned, true, 'Comment should be pinned');
                assert.ok(result.created_at, 'Result should have creation timestamp');

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping integration test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should handle invalid conversation ID gracefully', async function() {
            context.messages.in = {
                content: {
                    conversationId: 'cnv_invalid_test_id',
                    body: 'This should fail'
                }
            };

            try {
                await CreateComment.receive(context);
                assert.fail('Should have thrown an error for invalid conversation ID');
            } catch (error) {
                assert.ok(error.response, 'Error should have response object');
                assert.strictEqual(error.response.status, 404);
            }
        });
    });
});
