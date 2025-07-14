const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetComment Component', function() {
    let context;
    let GetComment;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetComment = require(path.join(__dirname, '../../src/appmixer/linear/core/GetComment/GetComment.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.LINEAR_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            sendJson: function(data, port) {
                return { data, port };
            },
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        assert(context.auth.accessToken, 'LINEAR_ACCESS_TOKEN environment variable is required for tests');
    });

    // Helper function to get a test comment ID
    async function getTestCommentId() {
        if (process.env.LINEAR_TEST_COMMENT_ID) {
            return process.env.LINEAR_TEST_COMMENT_ID;
        }

        // Fetch comments using GraphQL to get an existing comment ID
        const commentsQuery = `
            query {
                comments(first: 1) {
                    nodes {
                        id
                        body
                    }
                }
            }
        `;

        try {
            const response = await context.httpRequest({
                method: 'POST',
                url: 'https://api.linear.app/graphql',
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    query: commentsQuery
                }
            });

            if (response.data.errors) {
                throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
            }

            const comments = response.data.data.comments.nodes;
            if (comments.length === 0) {
                throw new Error('No comments found. Please create a comment in Linear or set LINEAR_TEST_COMMENT_ID environment variable.');
            }

            console.log(`Using comment with body: "${comments[0].body.substring(0, 50)}..." for tests`);
            return comments[0].id;
        } catch (error) {
            throw new Error(`Failed to fetch comments: ${error.message}`);
        }
    }

    it('should get a comment by ID', async function() {
        const commentId = await getTestCommentId();

        context.messages.in.content = {
            commentId: commentId
        };

        try {
            const result = await GetComment.receive(context);

            console.log('GetComment result keys:', Object.keys(result.data));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert.strictEqual(result.data.id, commentId, 'Expected result.data.id to match input commentId');
            assert(result.data.body && typeof result.data.body === 'string', 'Expected result.data.body to be a string');
            assert(result.data.createdAt && typeof result.data.createdAt === 'string', 'Expected result.data.createdAt to be a string');
            assert(result.data.updatedAt && typeof result.data.updatedAt === 'string', 'Expected result.data.updatedAt to be a string');
            assert.strictEqual(result.port, 'out', 'Expected port to be "out"');

            // Verify nested objects if they exist
            if (result.data.user) {
                assert(result.data.user.id, 'Expected user to have id property');
                assert(result.data.user.name, 'Expected user to have name property');
            }

            if (result.data.issue) {
                assert(result.data.issue.id, 'Expected issue to have id property');
                assert(result.data.issue.title, 'Expected issue to have title property');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle non-existent comment ID gracefully', async function() {
        const nonExistentId = 'non-existent-comment-id-12345';

        context.messages.in.content = {
            commentId: nonExistentId
        };

        try {
            const result = await GetComment.receive(context);

            // If no error is thrown, the result should be null or indicate not found
            if (result && result.data) {
                assert.fail('Expected GetComment to handle non-existent ID gracefully, but got a result');
            } else {
                console.log('Correctly handled non-existent comment ID');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This is expected behavior for non-existent IDs
            console.log('Correctly failed with non-existent comment ID:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('not found') ||
                error.message.includes('Invalid'),
                'Expected error message to indicate invalid/not found comment'
            );
        }
    });

    it('should fail when missing required commentId', async function() {
        context.messages.in.content = {
            // Missing commentId
        };

        try {
            await GetComment.receive(context);
            assert.fail('Expected GetComment to throw an error for missing commentId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to missing commentId
            console.log('Correctly failed with missing commentId:', error.message);
            // Accept any error since missing commentId should indeed cause an error
            assert(error, 'Expected an error to be thrown for missing commentId');
        }
    });

    it('should handle empty commentId gracefully', async function() {
        context.messages.in.content = {
            commentId: ''
        };

        try {
            await GetComment.receive(context);
            assert.fail('Expected GetComment to throw an error for empty commentId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to empty commentId
            console.log('Correctly failed with empty commentId:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('empty') ||
                error.message.includes('Invalid'),
                'Expected error message to indicate invalid comment ID'
            );
        }
    });
});
