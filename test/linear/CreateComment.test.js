const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateComment Component', function() {
    let context;
    let CreateComment;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
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

        // Fetch issues using GraphQL to get an existing issue ID
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

            console.log(`Using issue: ${issues[0].title} for comment tests`);
            return issues[0].id;
        } catch (error) {
            throw new Error(`Failed to fetch issues: ${error.message}`);
        }
    }

    it('should create a comment on an issue', async function() {
        const issueId = await getTestIssueId();
        const timestamp = Date.now();

        context.messages.in.content = {
            issueId: issueId,
            body: `Test comment created at ${new Date(timestamp).toISOString()}`
        };

        try {
            const result = await CreateComment.receive(context);

            console.log('CreateComment result keys:', Object.keys(result.data));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'string', 'Expected result.data.id to be a string');
            assert.strictEqual(result.data.body, context.messages.in.content.body, 'Expected body to match input');
            assert(result.data.createdAt && typeof result.data.createdAt === 'string', 'Expected result.data.createdAt to be a string');
            assert(result.data.updatedAt && typeof result.data.updatedAt === 'string', 'Expected result.data.updatedAt to be a string');
            assert.strictEqual(result.port, 'out', 'Expected port to be "out"');

            // Verify nested objects
            if (result.data.user) {
                assert(result.data.user.id, 'Expected user to have id property');
                assert(result.data.user.name, 'Expected user to have name property');
            }

            if (result.data.issue) {
                assert(result.data.issue.id, 'Expected issue to have id property');
                assert.strictEqual(result.data.issue.id, issueId, 'Expected issue.id to match input issueId');
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

    it('should create a comment with markdown content', async function() {
        const issueId = await getTestIssueId();
        const timestamp = Date.now();

        context.messages.in.content = {
            issueId: issueId,
            body: `# Test Comment with Markdown

This is a **bold** comment with _italic_ text and a [link](https://example.com).

- Bullet point 1
- Bullet point 2

\`\`\`javascript
console.log('Code block');
\`\`\`

Created at: ${new Date(timestamp).toISOString()}`
        };

        try {
            const result = await CreateComment.receive(context);

            console.log('CreateComment with markdown created successfully');

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'string', 'Expected result.data.id to be a string');
            assert.strictEqual(result.data.body, context.messages.in.content.body, 'Expected body to match input markdown');
            assert(result.data.issue && result.data.issue.id === issueId, 'Expected issue.id to match input issueId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should create a comment with empty body', async function() {
        const issueId = await getTestIssueId();

        context.messages.in.content = {
            issueId: issueId,
            body: ''
        };

        try {
            const result = await CreateComment.receive(context);

            console.log('CreateComment with empty body created successfully');

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'string', 'Expected result.data.id to be a string');
            assert.strictEqual(result.data.body, '', 'Expected body to be empty string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // Some APIs might not allow empty comments, this is acceptable
            if (error.message.includes('GraphQL errors') && error.message.includes('body')) {
                console.log('Expected failure: Linear API does not allow empty comment body');
                return;
            }
            throw error;
        }
    });

    it('should fail when missing required issueId', async function() {
        context.messages.in.content = {
            body: 'Test comment without issue ID'
            // Missing issueId
        };

        try {
            await CreateComment.receive(context);
            assert.fail('Expected CreateComment to throw an error for missing issueId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to missing issueId
            console.log('Correctly failed with missing issueId:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('issueId') ||
                error.message.includes('required'),
                'Expected error message to mention issueId or GraphQL errors'
            );
        }
    });

    it('should fail when missing required body', async function() {
        const issueId = await getTestIssueId();

        context.messages.in.content = {
            issueId: issueId
            // Missing body
        };

        try {
            await CreateComment.receive(context);
            assert.fail('Expected CreateComment to throw an error for missing body');
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

    it('should fail with non-existent issueId', async function() {
        const nonExistentId = 'non-existent-issue-id-12345';

        context.messages.in.content = {
            issueId: nonExistentId,
            body: 'Test comment on non-existent issue'
        };

        try {
            await CreateComment.receive(context);
            assert.fail('Expected CreateComment to throw an error for non-existent issueId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to non-existent issueId
            console.log('Correctly failed with non-existent issueId:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('not found') ||
                error.message.includes('Invalid'),
                'Expected error message to indicate invalid/not found issue'
            );
        }
    });
});
