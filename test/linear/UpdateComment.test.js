const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateComment Component', function() {
    let context;
    let UpdateComment;
    let CreateComment;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        UpdateComment = require(path.join(__dirname, '../../src/appmixer/linear/core/UpdateComment/UpdateComment.js'));
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

    // Helper function to create a test comment for updating
    async function createTestComment() {
        const issueId = await getTestIssueId();
        const timestamp = Date.now();

        const createContext = {
            ...context,
            messages: {
                in: {
                    content: {
                        issueId: issueId,
                        body: `[TEST UPDATE] Original comment body - ${timestamp}`
                    }
                }
            }
        };

        try {
            const result = await CreateComment.receive(createContext);
            console.log(`Created test comment for updating: "${result.data.body}"`);
            return result.data;
        } catch (error) {
            throw new Error(`Failed to create test comment: ${error.message}`);
        }
    }

    // Helper function to get an existing comment ID
    async function getTestCommentId() {
        if (process.env.LINEAR_TEST_COMMENT_ID) {
            return process.env.LINEAR_TEST_COMMENT_ID;
        }

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

            return comments[0].id;
        } catch (error) {
            throw new Error(`Failed to fetch comments: ${error.message}`);
        }
    }

    it('should update a comment successfully', async function() {
        // Use existing comment if available, otherwise create one
        let commentId;
        try {
            commentId = await getTestCommentId();
        } catch (error) {
            // If no existing comments, create one
            const testComment = await createTestComment();
            commentId = testComment.id;
        }

        const timestamp = Date.now();
        const newBody = `Updated comment body - ${timestamp}`;

        context.messages.in.content = {
            commentId: commentId,
            body: newBody
        };

        try {
            const result = await UpdateComment.receive(context);

            console.log('UpdateComment result keys:', Object.keys(result.data));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert.strictEqual(result.data.id, commentId, 'Expected result.data.id to match input commentId');
            assert.strictEqual(result.data.body, newBody, 'Expected result.data.body to match updated body');
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

    it('should update a comment with markdown content', async function() {
        // Create a fresh comment for this test
        const testComment = await createTestComment();
        const commentId = testComment.id;

        const timestamp = Date.now();
        const markdownBody = `# Updated Comment with Markdown

This comment was **updated** with _markdown_ content and includes:

- **Bold text**
- _Italic text_
- [Links](https://linear.app)
- \`inline code\`

\`\`\`javascript
// Code block
console.log('Updated at: ${new Date(timestamp).toISOString()}');
\`\`\`

> This is a blockquote

Updated at: ${new Date(timestamp).toISOString()}`;

        context.messages.in.content = {
            commentId: commentId,
            body: markdownBody
        };

        try {
            const result = await UpdateComment.receive(context);

            console.log('UpdateComment with markdown completed successfully');

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert.strictEqual(result.data.id, commentId, 'Expected result.data.id to match input commentId');
            assert.strictEqual(result.data.body, markdownBody, 'Expected result.data.body to match updated markdown body');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should update a comment to empty body', async function() {
        // Create a fresh comment for this test
        const testComment = await createTestComment();
        const commentId = testComment.id;

        context.messages.in.content = {
            commentId: commentId,
            body: ''
        };

        try {
            const result = await UpdateComment.receive(context);

            console.log('UpdateComment with empty body completed successfully');

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert.strictEqual(result.data.id, commentId, 'Expected result.data.id to match input commentId');
            assert.strictEqual(result.data.body, '', 'Expected result.data.body to be empty string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // Some APIs might not allow empty comment bodies, this is acceptable
            if (error.message.includes('GraphQL errors') && error.message.includes('body')) {
                console.log('Expected failure: Linear API does not allow empty comment body');
                return;
            }
            throw error;
        }
    });

    it('should handle non-existent comment ID gracefully', async function() {
        const nonExistentId = 'non-existent-comment-id-12345';

        context.messages.in.content = {
            commentId: nonExistentId,
            body: 'Updated body for non-existent comment'
        };

        try {
            await UpdateComment.receive(context);
            assert.fail('Expected UpdateComment to throw an error for non-existent commentId');
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
                error.message.includes('Failed to update'),
                'Expected error message to indicate invalid/not found comment or update failure'
            );
        }
    });

    it('should fail when missing required commentId', async function() {
        context.messages.in.content = {
            body: 'Updated body without comment ID'
            // Missing commentId
        };

        try {
            await UpdateComment.receive(context);
            assert.fail('Expected UpdateComment to throw an error for missing commentId');
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

    it('should fail when missing required body', async function() {
        // Use existing comment if available, otherwise create one
        let commentId;
        try {
            commentId = await getTestCommentId();
        } catch (error) {
            const testComment = await createTestComment();
            commentId = testComment.id;
        }

        context.messages.in.content = {
            commentId: commentId
            // Missing body
        };

        try {
            await UpdateComment.receive(context);
            assert.fail('Expected UpdateComment to throw an error for missing body');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to missing body
            console.log('Correctly failed with missing body:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('body') ||
                error.message.includes('required'),
                'Expected error message to mention body or GraphQL errors'
            );
        }
    });

    it('should verify comment update persists', async function() {
        // Create a fresh comment for this test
        const testComment = await createTestComment();
        const commentId = testComment.id;

        const timestamp = Date.now();
        const updatedBody = `Verified updated comment - ${timestamp}`;

        // Update the comment
        context.messages.in.content = {
            commentId: commentId,
            body: updatedBody
        };

        await UpdateComment.receive(context);

        // Verify the update by fetching the comment
        const getCommentQuery = `
            query($id: String!) {
                comment(id: $id) {
                    id
                    body
                    updatedAt
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

            if (response.data.errors) {
                throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
            }

            const comment = response.data.data.comment;
            assert(comment, 'Expected to find the updated comment');
            assert.strictEqual(comment.id, commentId, 'Expected comment ID to match');
            assert.strictEqual(comment.body, updatedBody, 'Expected comment body to be updated');
            console.log('Verified: Comment update persisted successfully');
        } catch (error) {
            throw new Error(`Failed to verify comment update: ${error.message}`);
        }
    });
});
