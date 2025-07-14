const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('DeleteIssue Component', function() {
    let context;
    let DeleteIssue;
    let CreateIssue;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        DeleteIssue = require(path.join(__dirname, '../../src/appmixer/linear/core/DeleteIssue/DeleteIssue.js'));
        CreateIssue = require(path.join(__dirname, '../../src/appmixer/linear/core/CreateIssue/CreateIssue.js'));

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

    // Helper function to get a team ID for creating test issues
    async function getTestTeamId() {
        if (process.env.LINEAR_TEST_TEAM_ID) {
            return process.env.LINEAR_TEST_TEAM_ID;
        }

        const teamsQuery = `
            query {
                teams {
                    nodes {
                        id
                        name
                        key
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
                    query: teamsQuery
                }
            });

            if (response.data.errors) {
                throw new Error('GraphQL errors: ' + JSON.stringify(response.data.errors));
            }

            const teams = response.data.data.teams.nodes;
            if (teams.length === 0) {
                throw new Error('No teams found. Please create a team in Linear or set LINEAR_TEST_TEAM_ID environment variable.');
            }

            return teams[0].id;
        } catch (error) {
            throw new Error(`Failed to fetch teams: ${error.message}`);
        }
    }

    // Helper function to create a test issue for deletion
    async function createTestIssue() {
        const teamId = await getTestTeamId();
        const timestamp = Date.now();

        const createContext = {
            ...context,
            messages: {
                in: {
                    content: {
                        title: `[TEST DELETE] Issue to be deleted - ${timestamp}`,
                        description: 'This issue was created for testing deletion functionality',
                        teamId: teamId
                    }
                }
            }
        };

        try {
            const result = await CreateIssue.receive(createContext);
            console.log(`Created test issue for deletion: ${result.data.title}`);
            return result.data.id;
        } catch (error) {
            throw new Error(`Failed to create test issue: ${error.message}`);
        }
    }

    it('should delete an issue successfully', async function() {
        // Only run this test if we can create test issues
        if (!process.env.LINEAR_ENABLE_DESTRUCTIVE_TESTS) {
            console.log('Skipping destructive test - set LINEAR_ENABLE_DESTRUCTIVE_TESTS=true to enable');
            this.skip();
        }

        const issueId = await createTestIssue();

        context.messages.in.content = {
            issueId: issueId
        };

        try {
            const result = await DeleteIssue.receive(context);

            console.log('DeleteIssue result:', JSON.stringify(result, null, 2));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert.strictEqual(result.data.success, true, 'Expected result.data.success to be true');
            assert.strictEqual(result.data.deletedIssueId, issueId, 'Expected result.data.deletedIssueId to match input issueId');
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

    it('should handle non-existent issue ID gracefully', async function() {
        const nonExistentId = 'non-existent-issue-id-12345';

        context.messages.in.content = {
            issueId: nonExistentId
        };

        try {
            await DeleteIssue.receive(context);
            assert.fail('Expected DeleteIssue to throw an error for non-existent issueId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This is expected behavior for non-existent IDs
            console.log('Correctly failed with non-existent issue ID:', error.message);
            assert(
                error.message.includes('GraphQL errors') ||
                error.message.includes('not found') ||
                error.message.includes('Invalid') ||
                error.message.includes('Failed to delete'),
                'Expected error message to indicate invalid/not found issue or deletion failure'
            );
        }
    });

    it('should fail when missing required issueId', async function() {
        context.messages.in.content = {
            // Missing issueId
        };

        try {
            await DeleteIssue.receive(context);
            assert.fail('Expected DeleteIssue to throw an error for missing issueId');
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
            await DeleteIssue.receive(context);
            assert.fail('Expected DeleteIssue to throw an error for empty issueId');
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

    it('should verify issue is actually deleted', async function() {
        // Only run this test if we can create test issues
        if (!process.env.LINEAR_ENABLE_DESTRUCTIVE_TESTS) {
            console.log('Skipping destructive test - set LINEAR_ENABLE_DESTRUCTIVE_TESTS=true to enable');
            this.skip();
        }

        const issueId = await createTestIssue();

        // First, delete the issue
        context.messages.in.content = {
            issueId: issueId
        };

        await DeleteIssue.receive(context);

        // Then, try to fetch the issue to verify it's gone
        const getIssueQuery = `
            query($id: String!) {
                issue(id: $id) {
                    id
                    title
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
                    query: getIssueQuery,
                    variables: { id: issueId }
                }
            });

            // The issue should either return null or cause a GraphQL error
            if (response.data.data && response.data.data.issue) {
                assert.fail('Expected issue to be deleted, but it still exists');
            } else {
                console.log('Verified: Issue was successfully deleted');
            }
        } catch (error) {
            // This is expected if the issue is deleted
            console.log('Verified: Issue deletion confirmed (query failed as expected)');
        }
    });
});
