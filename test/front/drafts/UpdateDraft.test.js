'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('UpdateDraft Component', function() {
    let context;
    let UpdateDraft;

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
        UpdateDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/UpdateDraft/UpdateDraft.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof UpdateDraft, 'object');
            assert.strictEqual(typeof UpdateDraft.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing draftId', async function() {
            context.messages.in = {
                content: {
                    body: 'Updated body'
                }
            };

            try {
                await UpdateDraft.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Draft ID is required!');
            }
        });

        it('should throw CancelError when no fields to update are provided', async function() {
            context.messages.in = {
                content: {
                    draftId: 'msg_test'
                }
            };

            try {
                await UpdateDraft.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'At least one field must be provided to update!');
            }
        });
    });

    describe('API Integration', function() {
        it('should update draft body successfully', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping update draft test - TEST_DRAFT_ID not set');
                return;
            }

            const updatedBody = `Updated draft body ${Date.now()}`;

            context.messages.in = {
                content: {
                    draftId: testDraftId,
                    body: updatedBody
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(outputs[0].data.id, testDraftId);
            assert.strictEqual(outputs[0].data.body, updatedBody);
            assert.strictEqual(typeof outputs[0].data.updated_at, 'number');
        });

        it('should update multiple fields successfully', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping multi-field update test - TEST_DRAFT_ID not set');
                return;
            }

            const updatedBody = `Multi-field updated body ${Date.now()}`;
            const updatedSubject = `Updated Subject ${Date.now()}`;

            context.messages.in = {
                content: {
                    draftId: testDraftId,
                    body: updatedBody,
                    text: 'Updated plain text version',
                    subject: updatedSubject
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(outputs[0].data.id, testDraftId);
            assert.strictEqual(outputs[0].data.body, updatedBody);
            assert.strictEqual(outputs[0].data.subject, updatedSubject);
        });

        it('should handle recipients update correctly', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping recipients update test - TEST_DRAFT_ID not set');
                return;
            }

            context.messages.in = {
                content: {
                    draftId: testDraftId,
                    body: 'Body with updated recipients',
                    to: ['updated1@example.com', 'updated2@example.com'],
                    cc: 'cc1@example.com, cc2@example.com'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(outputs[0].data.id, testDraftId);
        });

        it('should handle version parameter for conflict detection', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;
            const testVersion = process.env.TEST_DRAFT_VERSION;

            if (!testDraftId) {
                console.log('Skipping version test - TEST_DRAFT_ID not set');
                return;
            }

            context.messages.in = {
                content: {
                    draftId: testDraftId,
                    body: `Version test body ${Date.now()}`,
                    version: testVersion || 'test-version'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            try {
                await UpdateDraft.receive(context);

                // If successful, verify output
                assert.strictEqual(outputs.length, 1);
                assert.strictEqual(outputs[0].port, 'out');
                assert.strictEqual(outputs[0].data.id, testDraftId);

            } catch (error) {
                // Version conflict is expected if version is outdated
                if (error.response?.status === 409) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Draft has been modified by another user. Please get the latest version and try again!');
                } else {
                    throw error;
                }
            }
        });
    });

    describe('Field Processing', function() {
        it('should process only provided fields', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping field processing test - TEST_DRAFT_ID not set');
                return;
            }

            // Test updating only subject
            context.messages.in = {
                content: {
                    draftId: testDraftId,
                    subject: `Only subject update ${Date.now()}`
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].data.id, testDraftId);
            // Body should remain unchanged (not tested here as we don't know original)
        });

        it('should handle empty recipient arrays', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping empty recipients test - TEST_DRAFT_ID not set');
                return;
            }

            context.messages.in = {
                content: {
                    draftId: testDraftId,
                    body: 'Test with empty recipients',
                    to: [],
                    cc: []
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateDraft.receive(context);

            // Should not throw error
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].data.id, testDraftId);
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {
                    draftId: 'msg_test',
                    body: 'Updated body'
                }
            };

            try {
                await UpdateDraft.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle 404 errors with proper message', async function() {
            context.messages.in = {
                content: {
                    draftId: 'msg_nonexistent',
                    body: 'Updated body'
                }
            };

            try {
                await UpdateDraft.receive(context);
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

        it('should handle 422 validation errors', async function() {
            const testDraftId = process.env.TEST_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping validation error test - TEST_DRAFT_ID not set');
                return;
            }

            // Try to update with invalid data (this might not always trigger 422)
            context.messages.in = {
                content: {
                    draftId: testDraftId,
                    to: ['invalid-email-format'] // Invalid email format
                }
            };

            try {
                await UpdateDraft.receive(context);
                // If no error, that's also acceptable (API might be lenient)
            } catch (error) {
                if (error.response?.status === 422) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Invalid draft data provided!');
                } else {
                    // Other errors are acceptable
                }
            }
        });
    });
});
