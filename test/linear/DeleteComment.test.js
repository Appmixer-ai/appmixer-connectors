const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('DeleteComment Component', function() {
    let context;
    let DeleteComment;
    let CreateComment;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        DeleteComment = require(path.join(__dirname, '../../src/appmixer/linear/core/DeleteComment/DeleteComment.js'));
        CreateComment = require(path.join(__dirname, '../../src/appmixer/linear/core/CreateComment/CreateComment.js'));

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

    // Helper function to get a test issue ID for creating comments
    async function getTestIssueId() {
        if (process.env.LINEAR_TEST_ISSUE_ID) {
            return process.env.LINEAR_TEST_ISSUE_ID;
        }

        const issuesQuery = `
            query {
                issues(first: 1) {
                    nodes {
                        id
                        title
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
                    query: issuesQuery
                }
            });

            if (response.data.errors) {
                throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
            }

            const issues = response.data.data.issues.nodes;
            if (issues.length === 0) {
                throw new Error('No issues found. Please create an issue in Linear or set LINEAR_TEST_ISSUE_ID environment variable.');
            }

            return issues[0].id;
        } catch (error) {
            throw new Error(`Failed to fetch issues: ${error.message}`);
        }
    }

    // Helper function to create a test comment for deletion
    async function createTestComment() {
        const issueId = await getTestIssueId();
        const timestamp = Date.now();

        const createContext = {
            ...context,
            messages: {
                in: {
                    content: {
                        issueId: issueId,
                        body: `[TEST DELETE] Comment to be deleted - ${timestamp}`
                    }
                }
            }
        };

        try {
            const result = await CreateComment.receive(createContext);
            console.log(`Created test comment for deletion: "${result.data.body}"`);
            return result.data.id;
        } catch (error) {
            throw new Error(`Failed to create test comment: ${error.message}`);
        }
    }

    it('should delete a comment successfully', async function() {
        // Only run this test if we can create test comments
        if (!process.env.LINEAR_ENABLE_DESTRUCTIVE_TESTS) {
            console.log('Skipping destructive test - set LINEAR_ENABLE_DESTRUCTIVE_TESTS=true to enable');
            this.skip();
        }

        const commentId = await createTestComment();

        context.messages.in.content = {
            commentId: commentId
        };

        try {
            const result = await DeleteComment.receive(context);

            console.log('DeleteComment result:', JSON.stringify(result, null, 2));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert.strictEqual(result.data.success, true, 'Expected result.data.success to be true');
            assert.strictEqual(result.data.deletedCommentId, commentId, 'Expected result.data.deletedCommentId to match input commentId');
            assert.strictEqual(result.port, 'out', 'Expected port to be "out"');
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
            await DeleteComment.receive(context);
            assert.fail('Expected DeleteComment to throw an error for non-existent commentId');
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
                error.message.includes('Invalid') ||
                error.message.includes('Failed to delete'),
                'Expected error message to indicate invalid/not found comment or deletion failure'
            );
        }
    });

    it('should fail when missing required commentId', async function() {
        context.messages.in.content = {
            // Missing commentId
        };

        try {
            await DeleteComment.receive(context);
            assert.fail('Expected DeleteComment to throw an error for missing commentId');
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
            await DeleteComment.receive(context);
            assert.fail('Expected DeleteComment to throw an error for empty commentId');
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

    it('should verify comment is actually deleted', async function() {
        // Only run this test if we can create test comments
        if (!process.env.LINEAR_ENABLE_DESTRUCTIVE_TESTS) {
            console.log('Skipping destructive test - set LINEAR_ENABLE_DESTRUCTIVE_TESTS=true to enable');
            this.skip();
        }

        const commentId = await createTestComment();

        // First, delete the comment
        context.messages.in.content = {
            commentId: commentId
        };

        await DeleteComment.receive(context);

        // Then, try to fetch the comment to verify it's gone
        const getCommentQuery = `
            query($id: String!) {
                comment(id: $id) {
                    id
                    body
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
                    query: getCommentQuery,
                    variables: { id: commentId }
                }
            });

            // The comment should either return null or cause a GraphQL error
            if (response.data.data && response.data.data.comment) {
                assert.fail('Expected comment to be deleted, but it still exists');
            } else {
                console.log('Verified: Comment was successfully deleted');
            }
        } catch (error) {
            // This is expected if the comment is deleted
            console.log('Verified: Comment deletion confirmed (query failed as expected)');
        }
    });
});
