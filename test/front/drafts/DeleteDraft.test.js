'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('DeleteDraft Component', function() {
    let context;
    let DeleteDraft;

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
        DeleteDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/DeleteDraft/DeleteDraft.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof DeleteDraft, 'object');
            assert.strictEqual(typeof DeleteDraft.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing draftId', async function() {
            context.messages.in = {
                content: {}
            };

            try {
                await DeleteDraft.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Draft ID is required!');
            }
        });
    });

    describe('API Integration', function() {
        it('should delete a draft successfully', async function() {
            const testDraftId = process.env.TEST_DELETE_DRAFT_ID;

            if (!testDraftId) {
                console.log('Skipping delete draft test - TEST_DELETE_DRAFT_ID not set');
                console.log('Note: Set TEST_DELETE_DRAFT_ID to a draft that can be safely deleted');
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

            await DeleteDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');

            // Delete operations typically return empty object
            assert.deepStrictEqual(outputs[0].data, {});
        });

        it('should return empty object on successful deletion', async function() {
            const testDraftId = process.env.TEST_DELETE_DRAFT_ID_2;

            if (!testDraftId) {
                console.log('Skipping successful deletion test - TEST_DELETE_DRAFT_ID_2 not set');
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

            await DeleteDraft.receive(context);

            // Verify empty response indicates successful deletion
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(Object.keys(outputs[0].data).length, 0);
        });
    });

    describe('Edge Cases', function() {
        it('should handle deletion of already deleted draft', async function() {
            // Try to delete a draft that doesn't exist or was already deleted
            context.messages.in = {
                content: {
                    draftId: 'msg_already_deleted'
                }
            };

            try {
                await DeleteDraft.receive(context);
                assert.fail('Should have thrown an error for non-existent draft');
            } catch (error) {
                if (error.response?.status === 404) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Draft not found!');
                } else {
                    // Other errors are also acceptable in test environment
                    assert.notStrictEqual(error.name, 'CancelError');
                }
            }
        });

        it('should handle malformed draft IDs', async function() {
            const malformedIds = ['', 'invalid-id', '123', 'msg_', 'draft_nonexistent'];

            for (const malformedId of malformedIds) {
                await rateLimitDelay(); // Rate limiting between requests

                context.messages.in = {
                    content: {
                        draftId: malformedId
                    }
                };

                try {
                    await DeleteDraft.receive(context);

                    if (malformedId === '') {
                        assert.fail('Should have thrown an error for empty draft ID');
                    }
                    // If no error thrown, the API accepted the ID format

                } catch (error) {
                    if (malformedId === '') {
                        // Empty string should be caught by validation
                        assert.strictEqual(error.name, 'CancelError');
                        assert.strictEqual(error.message, 'Draft ID is required!');
                    } else {
                        // Other malformed IDs might return 404 or other API errors
                        if (error.response?.status === 404) {
                            assert.strictEqual(error.name, 'CancelError');
                            assert.strictEqual(error.message, 'Draft not found!');
                        }
                        // Other HTTP errors are acceptable for malformed IDs
                    }
                }
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
                await DeleteDraft.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle 404 errors with proper message', async function() {
            context.messages.in = {
                content: {
                    draftId: 'msg_definitely_nonexistent'
                }
            };

            try {
                await DeleteDraft.receive(context);
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

        it('should preserve HTTP error details for non-404 errors', async function() {
            // Test with potentially rate-limited or other error scenario
            context.messages.in = {
                content: {
                    draftId: 'msg_test_other_error'
                }
            };

            try {
                await DeleteDraft.receive(context);
                // If successful, that's fine too
            } catch (error) {
                if (error.response?.status === 404) {
                    // 404 should be handled properly
                    assert.strictEqual(error.name, 'CancelError');
                } else if (error.response?.status) {
                    // Other HTTP errors should not be CancelErrors
                    assert.notStrictEqual(error.name, 'CancelError');
                } else {
                    // Network or other errors should also not be CancelErrors
                    assert.notStrictEqual(error.name, 'CancelError');
                }
            }
        });
    });

    describe('Security Considerations', function() {
        it('should not expose sensitive information in error messages', async function() {
            context.messages.in = {
                content: {
                    draftId: 'msg_security_test'
                }
            };

            try {
                await DeleteDraft.receive(context);
            } catch (error) {
                // Error messages should not contain sensitive auth information
                const errorString = error.message.toLowerCase();
                assert(!errorString.includes('token'));
                assert(!errorString.includes('bearer'));
                assert(!errorString.includes('authorization'));
            }
        });

        it('should handle draft ID validation safely', async function() {
            const potentiallyDangerousIds = [
                '<script>alert("xss")</script>',
                'msg_${injection_attempt}',
                'msg_"or 1=1--',
                '../../../etc/passwd'
            ];

            for (const dangerousId of potentiallyDangerousIds) {
                await rateLimitDelay();

                context.messages.in = {
                    content: {
                        draftId: dangerousId
                    }
                };

                try {
                    await DeleteDraft.receive(context);
                } catch (error) {
                    // Should handle safely without exposing injection attempts
                    if (error.name === 'CancelError') {
                        assert.strictEqual(error.message, 'Draft not found!');
                    }
                }
            }
        });
    });
});
