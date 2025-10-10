'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('Front Comments End-to-End Integration Tests', function() {
    let CreateComment;
    let ListComments;
    let GetComment;
    let UpdateComment;
    let testConversationId;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            console.log('Skipping E2E tests - FRONT_API_TOKEN not set');
            this.skip();
        }

        // Load the components
        CreateComment = require(path.join(__dirname, '../../../src/appmixer/front/comments/CreateComment/CreateComment.js'));
        ListComments = require(path.join(__dirname, '../../../src/appmixer/front/comments/ListComments/ListComments.js'));
        GetComment = require(path.join(__dirname, '../../../src/appmixer/front/comments/GetComment/GetComment.js'));
        UpdateComment = require(path.join(__dirname, '../../../src/appmixer/front/comments/UpdateComment/UpdateComment.js'));

        // Set up test conversation ID
        testConversationId = process.env.FRONT_TEST_CONVERSATION_ID || 'cnv_test';

        if (!testConversationId.startsWith('cnv_')) {
            console.log('Skipping E2E tests - No valid FRONT_TEST_CONVERSATION_ID provided');
            this.skip();
        }
    });

    describe('End-to-End Comment Workflow', function() {
        it('should create a comment and then list it', async function() {
            const testMessage = `E2E test comment ${Date.now()}`;
            let createdCommentId;

            // Step 1: Create a comment
            const createContext = createTestContext(process.env.FRONT_API_TOKEN);
            createContext.messages.in = {
                content: {
                    conversationId: testConversationId,
                    body: testMessage
                }
            };

            try {
                await CreateComment.receive(createContext);

                assert.ok(createContext.lastSent, 'CreateComment should have sent output');
                const createResult = createContext.lastSent.data;
                createdCommentId = createResult.id;

                assert.ok(createResult.id, 'Created comment should have ID');
                assert.strictEqual(createResult.body, testMessage);

                // Add a small delay to ensure the comment is indexed
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Step 2: List comments and verify our comment is included
                const listContext = createTestContext(process.env.FRONT_API_TOKEN);
                listContext.messages.in = {
                    content: {
                        conversationId: testConversationId,
                        outputType: 'array'
                    }
                };

                await ListComments.receive(listContext);

                assert.ok(listContext.lastSent, 'ListComments should have sent output');
                const listResult = listContext.lastSent.data;

                assert.ok(Array.isArray(listResult.result), 'Result should be an array');
                assert.ok(listResult.count >= 1, 'Should have at least one comment');

                // Find our created comment
                const ourComment = listResult.result.find(comment => comment.id === createdCommentId);
                assert.ok(ourComment, 'Our created comment should be in the list');
                assert.strictEqual(ourComment.body, testMessage);

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping E2E test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should handle different output types for listing', async function() {
            const listContext = createTestContext(process.env.FRONT_API_TOKEN);
            listContext.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'first'
                }
            };

            try {
                await ListComments.receive(listContext);

                assert.ok(listContext.lastSent, 'ListComments should have sent output');
                const result = listContext.lastSent.data;

                if (result && result.id) {
                    // If we got a result, verify it has the expected structure
                    assert.ok(result.hasOwnProperty('index'), 'Should have index property');
                    assert.ok(result.hasOwnProperty('count'), 'Should have count property');
                    assert.strictEqual(result.index, 0, 'Should be the first comment');
                    assert.ok(result.id, 'Should have comment ID');
                }

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping E2E test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });
    });

    describe('Complete Comment Lifecycle', function() {
        it('should create, get, update, and list a comment with is_pinned parameter', async function() {
            const testMessage = `Complete lifecycle test ${Date.now()}`;
            const updatedMessage = `Updated: ${testMessage}`;
            let createdCommentId;

            try {
                // Step 1: Create a comment with is_pinned = true
                const createContext = createTestContext(process.env.FRONT_API_TOKEN);
                createContext.messages.in = {
                    content: {
                        conversationId: testConversationId,
                        body: testMessage,
                        is_pinned: true
                    }
                };

                await CreateComment.receive(createContext);

                assert.ok(createContext.lastSent, 'CreateComment should have sent output');
                const createResult = createContext.lastSent.data;
                createdCommentId = createResult.id;

                assert.ok(createResult.id, 'Created comment should have ID');
                assert.strictEqual(createResult.body, testMessage);
                assert.strictEqual(createResult.is_pinned, true, 'Comment should be pinned');

                // Add a small delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Step 2: Get the comment
                const getContext = createTestContext(process.env.FRONT_API_TOKEN);
                getContext.messages.in = {
                    content: {
                        commentId: createdCommentId
                    }
                };

                await GetComment.receive(getContext);

                assert.ok(getContext.lastSent, 'GetComment should have sent output');
                const getResult = getContext.lastSent.data;

                assert.strictEqual(getResult.id, createdCommentId);
                assert.strictEqual(getResult.body, testMessage);
                assert.strictEqual(getResult.is_pinned, true, 'Retrieved comment should be pinned');

                // Add a small delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Step 3: Update the comment (change body and unpin)
                const updateContext = createTestContext(process.env.FRONT_API_TOKEN);
                updateContext.messages.in = {
                    content: {
                        commentId: createdCommentId,
                        body: updatedMessage,
                        is_pinned: false
                    }
                };

                await UpdateComment.receive(updateContext);

                assert.ok(updateContext.lastSent, 'UpdateComment should have sent output');
                const updateResult = updateContext.lastSent.data;

                assert.strictEqual(updateResult.id, createdCommentId);
                assert.strictEqual(updateResult.body, updatedMessage);
                assert.strictEqual(updateResult.is_pinned, false, 'Updated comment should not be pinned');

                // Add a small delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Step 4: List comments and verify our updated comment
                const listContext = createTestContext(process.env.FRONT_API_TOKEN);
                listContext.messages.in = {
                    content: {
                        conversationId: testConversationId,
                        outputType: 'array'
                    }
                };

                await ListComments.receive(listContext);

                assert.ok(listContext.lastSent, 'ListComments should have sent output');
                const listResult = listContext.lastSent.data;

                // Find our updated comment
                const ourComment = listResult.result.find(comment => comment.id === createdCommentId);
                assert.ok(ourComment, 'Our updated comment should be in the list');
                assert.strictEqual(ourComment.body, updatedMessage);
                assert.strictEqual(ourComment.is_pinned, false, 'Listed comment should not be pinned');

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping complete lifecycle test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should update only pin status without changing body', async function() {
            const testMessage = `Pin test ${Date.now()}`;
            let createdCommentId;

            try {
                // Step 1: Create a comment without pinning
                const createContext = createTestContext(process.env.FRONT_API_TOKEN);
                createContext.messages.in = {
                    content: {
                        conversationId: testConversationId,
                        body: testMessage,
                        is_pinned: false
                    }
                };

                await CreateComment.receive(createContext);
                createdCommentId = createContext.lastSent.data.id;

                // Add a small delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Step 2: Update only the pin status
                const updateContext = createTestContext(process.env.FRONT_API_TOKEN);
                updateContext.messages.in = {
                    content: {
                        commentId: createdCommentId,
                        is_pinned: true
                    }
                };

                await UpdateComment.receive(updateContext);

                assert.ok(updateContext.lastSent, 'UpdateComment should have sent output');
                const updateResult = updateContext.lastSent.data;

                assert.strictEqual(updateResult.id, createdCommentId);
                assert.strictEqual(updateResult.body, testMessage, 'Body should remain unchanged');
                assert.strictEqual(updateResult.is_pinned, true, 'Comment should now be pinned');

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping pin test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });
    });
});
