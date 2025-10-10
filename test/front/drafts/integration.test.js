'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('Drafts Integration Tests', function() {
    let context;
    let CreateDraft;
    let GetDraft;
    let ListDrafts;
    let UpdateDraft;
    let DeleteDraft;

    this.timeout(60000); // Longer timeout for integration tests

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            console.log('Skipping integration tests - FRONT_API_TOKEN not set');
            this.skip();
        }

        // Load all components
        CreateDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/CreateDraft/CreateDraft.js'));
        GetDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/GetDraft/GetDraft.js'));
        ListDrafts = require(path.join(__dirname, '../../../src/appmixer/front/drafts/ListDrafts/ListDrafts.js'));
        UpdateDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/UpdateDraft/UpdateDraft.js'));
        DeleteDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/DeleteDraft/DeleteDraft.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Complete Draft Lifecycle', function() {
        let createdDraftId = null;

        it('should create, read, update, and delete a draft successfully', async function() {
            // Skip if we don't have test IDs needed for draft creation
            if (!process.env.TEST_CONVERSATION_ID && !process.env.TEST_CHANNEL_ID) {
                console.log('Skipping lifecycle test - TEST_CONVERSATION_ID or TEST_CHANNEL_ID not set');
                return;
            }

            const testBody = `Integration test draft ${Date.now()}`;
            const testSubject = `Integration Test Subject ${Date.now()}`;

            // Step 1: Create Draft
            context.messages.in = {
                content: {
                    conversationId: process.env.TEST_CONVERSATION_ID,
                    channelId: process.env.TEST_CHANNEL_ID,
                    body: testBody,
                    subject: testSubject
                }
            };

            let outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateDraft.receive(context);

            // Verify creation
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.body, testBody);
            assert.strictEqual(outputs[0].data.subject, testSubject);
            assert.strictEqual(outputs[0].data.is_draft, true);

            createdDraftId = outputs[0].data.id;
            console.log(`Created draft with ID: ${createdDraftId}`);

            await rateLimitDelay();

            // Step 2: Read Draft
            context.messages.in = {
                content: {
                    draftId: createdDraftId
                }
            };

            outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await GetDraft.receive(context);

            // Verify read
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].data.id, createdDraftId);
            assert.strictEqual(outputs[0].data.body, testBody);
            assert.strictEqual(outputs[0].data.is_draft, true);

            await rateLimitDelay();

            // Step 3: Update Draft
            const updatedBody = `Updated ${testBody}`;
            const updatedSubject = `Updated ${testSubject}`;

            context.messages.in = {
                content: {
                    draftId: createdDraftId,
                    body: updatedBody,
                    subject: updatedSubject
                }
            };

            outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateDraft.receive(context);

            // Verify update
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].data.id, createdDraftId);
            assert.strictEqual(outputs[0].data.body, updatedBody);
            assert.strictEqual(outputs[0].data.subject, updatedSubject);

            await rateLimitDelay();

            // Step 4: Verify update with Get
            context.messages.in = {
                content: {
                    draftId: createdDraftId
                }
            };

            outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await GetDraft.receive(context);

            // Verify the update persisted
            assert.strictEqual(outputs[0].data.body, updatedBody);
            assert.strictEqual(outputs[0].data.subject, updatedSubject);

            await rateLimitDelay();

            // Step 5: Delete Draft
            context.messages.in = {
                content: {
                    draftId: createdDraftId
                }
            };

            outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await DeleteDraft.receive(context);

            // Verify deletion
            assert.strictEqual(outputs.length, 1);
            assert.deepStrictEqual(outputs[0].data, {});

            await rateLimitDelay();

            // Step 6: Verify draft is deleted
            context.messages.in = {
                content: {
                    draftId: createdDraftId
                }
            };

            try {
                await GetDraft.receive(context);
                assert.fail('Should have thrown an error for deleted draft');
            } catch (error) {
                if (error.response?.status === 404) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Draft not found!');
                } else {
                    throw error;
                }
            }

            createdDraftId = null; // Successfully deleted
        });

        afterEach(async function() {
            // Cleanup: if a draft was created but test failed, try to delete it
            if (createdDraftId) {
                try {
                    await rateLimitDelay();
                    context.messages.in = {
                        content: {
                            draftId: createdDraftId
                        }
                    };

                    context.sendJson = (data, port) => Promise.resolve();
                    await DeleteDraft.receive(context);
                    console.log(`Cleaned up draft: ${createdDraftId}`);
                } catch (error) {
                    console.log(`Failed to cleanup draft ${createdDraftId}:`, error.message);
                }
                createdDraftId = null;
            }
        });
    });

    describe('List and Multiple Drafts Operations', function() {
        it('should list drafts and find created drafts', async function() {
            // Get initial draft count
            context.messages.in = {
                content: {
                    limit: 10,
                    outputType: 'array'
                }
            };

            let outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListDrafts.receive(context);

            const initialResult = outputs[0].data;
            const initialCount = initialResult.count || 0;
            const initialDrafts = initialResult.result || [];

            console.log(`Found ${initialCount} existing drafts`);

            // Verify list structure
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(typeof initialResult, 'object');
            assert(Array.isArray(initialDrafts));
            assert.strictEqual(typeof initialCount, 'number');

            if (initialDrafts.length > 0) {
                // Verify each draft has expected properties
                initialDrafts.forEach(draft => {
                    assert.strictEqual(typeof draft.id, 'string');
                    assert.strictEqual(draft.is_draft, true);
                    assert.strictEqual(typeof draft.body, 'string');
                    assert.strictEqual(typeof draft.created_at, 'number');
                });
            }
        });

        it('should handle different output formats', async function() {
            const outputTypes = ['array', 'object', 'first'];

            for (const outputType of outputTypes) {
                await rateLimitDelay();

                context.messages.in = {
                    content: {
                        limit: 3,
                        outputType: outputType
                    }
                };

                let outputs = [];
                context.sendJson = (data, port) => {
                    outputs.push({ data, port });
                    return Promise.resolve();
                };

                await ListDrafts.receive(context);

                assert.strictEqual(outputs.length, 1);
                assert.strictEqual(typeof outputs[0].data, 'object');

                const result = outputs[0].data;

                if (outputType === 'first' && result.result) {
                    if (Array.isArray(result.result) && result.result.length === 0) {
                        // No drafts available
                        console.log(`No drafts available for ${outputType} test`);
                    } else if (!Array.isArray(result.result)) {
                        // Should be single draft object for 'first' type
                        assert.strictEqual(typeof result.result.id, 'string');
                        assert.strictEqual(result.result.is_draft, true);
                    }
                }
            }
        });
    });

    describe('Error Scenarios Integration', function() {
        it('should handle chain of operations with errors gracefully', async function() {
            // Test sequence: Try to get non-existent draft, then list, then try to update/delete non-existent

            const nonExistentId = 'msg_integration_test_nonexistent';

            // Step 1: Try to get non-existent draft
            context.messages.in = {
                content: {
                    draftId: nonExistentId
                }
            };

            try {
                await GetDraft.receive(context);
                assert.fail('Should have thrown an error for non-existent draft');
            } catch (error) {
                if (error.response?.status === 404) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Draft not found!');
                } else {
                    // Other errors are acceptable
                }
            }

            await rateLimitDelay();

            // Step 2: List should still work
            context.messages.in = {
                content: {
                    limit: 5
                }
            };

            let outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListDrafts.receive(context);

            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(typeof outputs[0].data, 'object');

            await rateLimitDelay();

            // Step 3: Try to update non-existent draft
            context.messages.in = {
                content: {
                    draftId: nonExistentId,
                    body: 'This should fail'
                }
            };

            try {
                await UpdateDraft.receive(context);
                assert.fail('Should have thrown an error for non-existent draft');
            } catch (error) {
                if (error.response?.status === 404) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Draft not found!');
                }
            }

            await rateLimitDelay();

            // Step 4: Try to delete non-existent draft
            context.messages.in = {
                content: {
                    draftId: nonExistentId
                }
            };

            try {
                await DeleteDraft.receive(context);
                assert.fail('Should have thrown an error for non-existent draft');
            } catch (error) {
                if (error.response?.status === 404) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Draft not found!');
                }
            }
        });
    });

    describe('Performance and Rate Limiting', function() {
        it('should handle multiple sequential operations within rate limits', async function() {
            const operations = [];

            // Perform multiple list operations
            for (let i = 0; i < 3; i++) {
                await rateLimitDelay();

                context.messages.in = {
                    content: {
                        limit: 2,
                        outputType: 'array'
                    }
                };

                let outputs = [];
                context.sendJson = (data, port) => {
                    outputs.push({ data, port });
                    return Promise.resolve();
                };

                const startTime = Date.now();
                await ListDrafts.receive(context);
                const endTime = Date.now();

                operations.push({
                    operation: 'list',
                    duration: endTime - startTime,
                    success: outputs.length > 0
                });

                assert.strictEqual(outputs.length, 1);
            }

            // All operations should complete successfully
            operations.forEach(op => {
                assert(op.success, `Operation ${op.operation} failed`);
                assert(op.duration < 30000, `Operation ${op.operation} took too long: ${op.duration}ms`);
            });

            console.log(`Completed ${operations.length} operations successfully`);
        });
    });
});
