'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('UpdateComment Component', function() {
    let context;
    let UpdateComment;

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
        UpdateComment = require(path.join(__dirname, '../../../src/appmixer/front/comments/UpdateComment/UpdateComment.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof UpdateComment, 'object');
            assert.strictEqual(typeof UpdateComment.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing commentId', async function() {
            context.messages.in = {
                content: {
                    body: 'Updated comment body'
                }
            };

            try {
                await UpdateComment.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Comment ID is required.');
            }
        });

        it('should throw CancelError when no update fields are provided', async function() {
            context.messages.in = {
                content: {
                    commentId: 'com_test'
                }
            };

            try {
                await UpdateComment.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'At least one field (body or is_pinned) must be provided for update.');
            }
        });
    });

    describe('API Integration', function() {
        it('should handle invalid comment ID gracefully', async function() {
            context.messages.in = {
                content: {
                    commentId: 'com_invalid_test_id',
                    body: 'Updated body'
                }
            };

            try {
                await UpdateComment.receive(context);
                assert.fail('Should have thrown an error for invalid comment ID');
            } catch (error) {
                assert.ok(error.response, 'Error should have response object');
                assert.strictEqual(error.response.status, 404);
            }
        });

        it('should handle authentication errors', async function() {
            const invalidContext = createTestContext('invalid_token');
            invalidContext.messages.in = {
                content: {
                    commentId: 'com_test',
                    is_pinned: true
                }
            };

            try {
                await UpdateComment.receive(invalidContext);
                assert.fail('Should have thrown an authentication error');
            } catch (error) {
                assert.ok(error.response, 'Error should have response object');
                assert.strictEqual(error.response.status, 401);
            }
        });

        // Note: We can't easily test successful updates without a real comment ID
        // This would require creating a comment first, then updating it
        // That functionality is tested in the integration tests
    });
});
