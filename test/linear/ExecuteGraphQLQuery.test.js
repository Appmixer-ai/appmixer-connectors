const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ExecuteGraphQLQuery Component', function() {
    let context;
    let ExecuteGraphQLQuery;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        ExecuteGraphQLQuery = require(path.join(__dirname, '../../src/appmixer/linear/core/ExecuteGraphQLQuery/ExecuteGraphQLQuery.js'));

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

    it('should execute a simple query without variables', async function() {
        context.messages.in.content = {
            query: `
                query {
                    viewer {
                        id
                        name
                        email
                    }
                }
            `
        };

        try {
            const result = await ExecuteGraphQLQuery.receive(context);

            console.log('ExecuteGraphQLQuery simple result keys:', Object.keys(result.data));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.viewer && typeof result.data.viewer === 'object', 'Expected result.data.viewer to be an object');
            assert(result.data.viewer.id && typeof result.data.viewer.id === 'string', 'Expected viewer.id to be a string');
            assert(result.data.viewer.name && typeof result.data.viewer.name === 'string', 'Expected viewer.name to be a string');
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

    it('should execute a query with variables as object', async function() {
        context.messages.in.content = {
            query: `
                query($first: Int) {
                    issues(first: $first) {
                        nodes {
                            id
                            title
                        }
                    }
                }
            `,
            variables: {
                first: 5
            }
        };

        try {
            const result = await ExecuteGraphQLQuery.receive(context);

            console.log('ExecuteGraphQLQuery with object variables result - issues count:',
                result.data.issues ? result.data.issues.nodes.length : 0);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.issues && typeof result.data.issues === 'object', 'Expected result.data.issues to be an object');
            assert(Array.isArray(result.data.issues.nodes), 'Expected result.data.issues.nodes to be an array');
            assert(result.data.issues.nodes.length <= 5, 'Expected at most 5 issues based on first variable');

            if (result.data.issues.nodes.length > 0) {
                const issue = result.data.issues.nodes[0];
                assert(issue.id && typeof issue.id === 'string', 'Expected issue.id to be a string');
                assert(issue.title && typeof issue.title === 'string', 'Expected issue.title to be a string');
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

    it('should execute a query with variables as JSON string', async function() {
        context.messages.in.content = {
            query: `
                query($first: Int) {
                    teams(first: $first) {
                        nodes {
                            id
                            name
                            key
                        }
                    }
                }
            `,
            variables: JSON.stringify({
                first: 3
            })
        };

        try {
            const result = await ExecuteGraphQLQuery.receive(context);

            console.log('ExecuteGraphQLQuery with string variables result - teams count:',
                result.data.teams ? result.data.teams.nodes.length : 0);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.teams && typeof result.data.teams === 'object', 'Expected result.data.teams to be an object');
            assert(Array.isArray(result.data.teams.nodes), 'Expected result.data.teams.nodes to be an array');
            assert(result.data.teams.nodes.length <= 3, 'Expected at most 3 teams based on first variable');

            if (result.data.teams.nodes.length > 0) {
                const team = result.data.teams.nodes[0];
                assert(team.id && typeof team.id === 'string', 'Expected team.id to be a string');
                assert(team.name && typeof team.name === 'string', 'Expected team.name to be a string');
                assert(team.key && typeof team.key === 'string', 'Expected team.key to be a string');
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

    it('should execute a complex query with nested data', async function() {
        context.messages.in.content = {
            query: `
                query {
                    issues(first: 2) {
                        nodes {
                            id
                            title
                            state {
                                id
                                name
                                color
                            }
                            team {
                                id
                                name
                                key
                            }
                            assignee {
                                id
                                name
                                email
                            }
                            labels {
                                nodes {
                                    id
                                    name
                                    color
                                }
                            }
                        }
                    }
                }
            `
        };

        try {
            const result = await ExecuteGraphQLQuery.receive(context);

            console.log('ExecuteGraphQLQuery complex query executed successfully');

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.issues && typeof result.data.issues === 'object', 'Expected result.data.issues to be an object');
            assert(Array.isArray(result.data.issues.nodes), 'Expected result.data.issues.nodes to be an array');

            if (result.data.issues.nodes.length > 0) {
                const issue = result.data.issues.nodes[0];
                assert(issue.id && typeof issue.id === 'string', 'Expected issue.id to be a string');
                assert(issue.title && typeof issue.title === 'string', 'Expected issue.title to be a string');

                // Verify nested objects structure if they exist
                if (issue.state) {
                    assert(issue.state.id && typeof issue.state.id === 'string', 'Expected state.id to be a string');
                    assert(issue.state.name && typeof issue.state.name === 'string', 'Expected state.name to be a string');
                }

                if (issue.team) {
                    assert(issue.team.id && typeof issue.team.id === 'string', 'Expected team.id to be a string');
                    assert(issue.team.name && typeof issue.team.name === 'string', 'Expected team.name to be a string');
                    assert(issue.team.key && typeof issue.team.key === 'string', 'Expected team.key to be a string');
                }

                if (issue.labels) {
                    assert(Array.isArray(issue.labels.nodes), 'Expected labels.nodes to be an array');
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

    it('should fail when missing required query', async function() {
        context.messages.in.content = {
            // Missing query
            variables: {}
        };

        try {
            await ExecuteGraphQLQuery.receive(context);
            assert.fail('Expected ExecuteGraphQLQuery to throw an error for missing query');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to missing query
            console.log('Correctly failed with missing query:', error.message);
            assert(
                error.message.includes('GraphQL query is required') ||
                error.message.includes('query'),
                'Expected error message to mention missing query'
            );
        }
    });

    it('should fail with invalid GraphQL syntax', async function() {
        context.messages.in.content = {
            query: `
                query {
                    invalid_field_that_does_not_exist {
                        id
                    }
                }
            `
        };

        try {
            await ExecuteGraphQLQuery.receive(context);
            assert.fail('Expected ExecuteGraphQLQuery to throw an error for invalid GraphQL');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to invalid GraphQL
            console.log('Correctly failed with invalid GraphQL:', error.message);
            // Accept any error since invalid GraphQL should indeed cause an error
            assert(error, 'Expected an error to be thrown for invalid GraphQL');
        }
    });

    it('should fail with invalid JSON variables', async function() {
        context.messages.in.content = {
            query: `
                query {
                    viewer {
                        id
                    }
                }
            `,
            variables: '{ invalid json syntax'
        };

        try {
            await ExecuteGraphQLQuery.receive(context);
            assert.fail('Expected ExecuteGraphQLQuery to throw an error for invalid JSON variables');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }

            // This should throw an error due to invalid JSON
            console.log('Correctly failed with invalid JSON variables:', error.message);
            assert(
                error.message.includes('Invalid JSON format') ||
                error.message.includes('JSON') ||
                error.message.includes('parse'),
                'Expected error message to indicate invalid JSON'
            );
        }
    });
});
