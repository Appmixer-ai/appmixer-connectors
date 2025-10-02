'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('GetDraft Component', function() {
    let context;
    let GetDraft;

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
        GetDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/GetDraft/GetDraft.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof GetDraft, 'object');
            assert.strictEqual(typeof GetDraft.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing draftId', async function() {
            context.messages.in = {
                content: {}
            };

            try {
                await GetDraft.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Draft ID is required!');
            }
        });
    });

    describe('API Integration', function() {
        it('should retrieve a draft successfully', async function() {
            // Note: This test requires a valid draft ID
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping get draft test - TEST_DRAFT_ID not set');
                return;
            }

            context.messages.in = {
                content: {
                    draftId: testDraftId
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await GetDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(outputs[0].data.id, testDraftId);
            assert.strictEqual(outputs[0].data.is_draft, true);
            assert.strictEqual(typeof outputs[0].data.body, 'string');
            assert.strictEqual(typeof outputs[0].data.created_at, 'number');
        });

        it('should verify draft properties are present', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping draft properties test - TEST_DRAFT_ID not set');
                return;
            }

            context.messages.in = {
                content: {
                    draftId: testDraftId
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await GetDraft.receive(context);

            // Verify draft-specific properties
            const draft = outputs[0].data;
            assert.strictEqual(draft.is_draft, true);
            assert(draft.hasOwnProperty('id'));
            assert(draft.hasOwnProperty('type'));
            assert(draft.hasOwnProperty('body'));
            assert(draft.hasOwnProperty('author'));
            assert(draft.hasOwnProperty('created_at'));

            if (draft.version) {
                assert.strictEqual(typeof draft.version, 'string');
            }
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {
                    draftId: 'msg_test'
                }
            };

            try {
                await GetDraft.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle 404 errors with proper message', async function() {
            context.messages.in = {
                content: {
                    draftId: 'msg_nonexistent'
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
                    // Other errors are acceptable in test environment
                    assert.notStrictEqual(error.name, 'CancelError');
                }
            }
        });

        it('should reject messages that are not drafts', async function() {
            // Note: This would require a real message ID that's not a draft
            const testMessageId = process.env.TEST_MESSAGE_ID;

            if (!testMessageId) {
                console.log('Skipping non-draft message test - TEST_MESSAGE_ID not set');
                return;
            }

            context.messages.in = {
                content: {
                    draftId: testMessageId
                }
            };

            try {
                await GetDraft.receive(context);
                assert.fail('Should have thrown an error for non-draft message');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'The specified message is not a draft!');
            }
        });
    });
});
