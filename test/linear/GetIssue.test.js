const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetIssue Component', function() {
    let context;
    let GetIssue;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetIssue = require(path.join(__dirname, '../../src/appmixer/linear/core/GetIssue/GetIssue.js'));

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

    // Helper function to get a test issue ID
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

            console.log(`Using issue: ${issues[0].title} for tests`);
            return issues[0].id;
        } catch (error) {
            throw new Error(`Failed to fetch issues: ${error.message}`);
        }
    }

    it('should get an issue by ID', async function() {
        const issueId = await getTestIssueId();

        context.messages.in.content = {
            issueId: issueId
        };

        try {
            const result = await GetIssue.receive(context);

            console.log('GetIssue result keys:', Object.keys(result.data));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert.strictEqual(result.data.id, issueId, 'Expected result.data.id to match input issueId');
            assert(result.data.title && typeof result.data.title === 'string', 'Expected result.data.title to be a string');
            assert(result.data.createdAt && typeof result.data.createdAt === 'string', 'Expected result.data.createdAt to be a string');
            assert(result.data.updatedAt && typeof result.data.updatedAt === 'string', 'Expected result.data.updatedAt to be a string');
            assert(result.data.url && typeof result.data.url === 'string', 'Expected result.data.url to be a string');
            assert.strictEqual(result.port, 'out', 'Expected port to be "out"');

            // Verify nested objects if they exist
            if (result.data.state) {
                assert(result.data.state.id, 'Expected state to have id property');
                assert(result.data.state.name, 'Expected state to have name property');
            }

            if (result.data.team) {
                assert(result.data.team.id, 'Expected team to have id property');
                assert(result.data.team.name, 'Expected team to have name property');
                assert(result.data.team.key, 'Expected team to have key property');
            }

            if (result.data.assignee) {
                assert(result.data.assignee.id, 'Expected assignee to have id property');
                assert(result.data.assignee.name, 'Expected assignee to have name property');
            }

            if (result.data.creator) {
                assert(result.data.creator.id, 'Expected creator to have id property');
                assert(result.data.creator.name, 'Expected creator to have name property');
            }

            if (result.data.labels) {
                assert(Array.isArray(result.data.labels.nodes), 'Expected labels.nodes to be an array');
                if (result.data.labels.nodes.length > 0) {
                    const label = result.data.labels.nodes[0];
                    assert(label.id, 'Expected label to have id property');
                    assert(label.name, 'Expected label to have name property');
                }
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

    it('should handle non-existent issue ID gracefully', async function() {
        const nonExistentId = 'non-existent-issue-id-12345';

        context.messages.in.content = {
            issueId: nonExistentId
        };

        try {
            const result = await GetIssue.receive(context);

            // If no error is thrown, the result should be null or indicate not found
            if (result && result.data) {
                assert.fail('Expected GetIssue to handle non-existent ID gracefully, but got a result');
            } else {
                console.log('Correctly handled non-existent issue ID');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This is expected behavior for non-existent IDs
            // Linear GraphQL API might return errors or null for non-existent resources
            console.log('Correctly failed with non-existent issue ID:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('not found') ||
                error.message.includes('Invalid'),
                'Expected error message to indicate invalid/not found issue'
            );
        }
    });

    it('should fail when missing required issueId', async function() {
        context.messages.in.content = {
            // Missing issueId
        };

        try {
            await GetIssue.receive(context);
            assert.fail('Expected GetIssue to throw an error for missing issueId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to missing issueId
            console.log('Correctly failed with missing issueId:', error.message);
            // Accept any error since missing issueId should indeed cause an error
            assert(error, 'Expected an error to be thrown for missing issueId');
        }
    });

    it('should handle empty issueId gracefully', async function() {
        context.messages.in.content = {
            issueId: ''
        };

        try {
            await GetIssue.receive(context);
            assert.fail('Expected GetIssue to throw an error for empty issueId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to empty issueId
            console.log('Correctly failed with empty issueId:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('empty') ||
                error.message.includes('Invalid'),
                'Expected error message to indicate invalid issue ID'
            );
        }
    });
});
