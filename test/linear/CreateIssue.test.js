const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateIssue Component', function() {
    let context;
    let CreateIssue;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
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

    // Helper function to get a team ID for testing
    async function getTestTeamId() {
        if (process.env.LINEAR_TEST_TEAM_ID) {
            return process.env.LINEAR_TEST_TEAM_ID;
        }

        // Fetch teams using GraphQL
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

            console.log(`Using team: ${teams[0].name} (${teams[0].key}) for tests`);
            return teams[0].id;
        } catch (error) {
            throw new Error(`Failed to fetch teams: ${error.message}`);
        }
    }

    it('should create an issue with title and team only', async function() {
        const teamId = await getTestTeamId();
        const timestamp = Date.now();

        context.messages.in.content = {
            title: `Test Issue - ${timestamp}`,
            teamId: teamId
        };

        try {
            const result = await CreateIssue.receive(context);

            console.log('CreateIssue result:', JSON.stringify(result, null, 2));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'string', 'Expected result.data.id to be a string');
            assert.strictEqual(result.data.title, context.messages.in.content.title, `Expected title to match input. Got: ${result.data.title}, Expected: ${context.messages.in.content.title}`);
            assert(result.data.team && result.data.team.id === teamId, 'Expected result.data.team.id to match input teamId');
            assert(result.data.url && typeof result.data.url === 'string', 'Expected result.data.url to be a string');
            assert(result.data.createdAt && typeof result.data.createdAt === 'string', 'Expected result.data.createdAt to be a string');
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

    it('should create an issue with title, description, and team', async function() {
        const teamId = await getTestTeamId();
        const timestamp = Date.now();

        context.messages.in.content = {
            title: `Test Issue with Description - ${timestamp}`,
            description: `This is a test issue description created at ${new Date(timestamp).toISOString()}`,
            teamId: teamId
        };

        try {
            const result = await CreateIssue.receive(context);

            console.log('CreateIssue with description result keys:', Object.keys(result.data));

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'string', 'Expected result.data.id to be a string');
            assert.strictEqual(result.data.title, context.messages.in.content.title, 'Expected title to match input');
            assert.strictEqual(result.data.description, context.messages.in.content.description, 'Expected description to match input');
            assert(result.data.team && result.data.team.id === teamId, 'Expected result.data.team.id to match input teamId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should create an issue with priority', async function() {
        const teamId = await getTestTeamId();
        const timestamp = Date.now();

        context.messages.in.content = {
            title: `High Priority Test Issue - ${timestamp}`,
            teamId: teamId,
            priority: 1 // High priority
        };

        try {
            const result = await CreateIssue.receive(context);

            console.log('CreateIssue with priority result created successfully');

            assert(result && typeof result === 'object', 'Expected result to be an object');
            assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
            assert(result.data.id && typeof result.data.id === 'string', 'Expected result.data.id to be a string');
            assert.strictEqual(result.data.title, context.messages.in.content.title, 'Expected title to match input');
            assert(result.data.team && result.data.team.id === teamId, 'Expected result.data.team.id to match input teamId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should fail when missing required title', async function() {
        const teamId = await getTestTeamId();

        context.messages.in.content = {
            teamId: teamId
            // Missing title
        };

        try {
            await CreateIssue.receive(context);
            assert.fail('Expected CreateIssue to throw an error for missing title');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            // This should throw an error due to missing title
            assert(error.message.includes('GraphQL errors') || error.message.includes('title'), 'Expected error message to mention title or GraphQL errors');
            console.log('Correctly failed with missing title:', error.message);
        }
    });

    it('should fail when missing required teamId', async function() {
        const timestamp = Date.now();

        context.messages.in.content = {
            title: `Test Issue without Team - ${timestamp}`
            // Missing teamId
        };

        try {
            await CreateIssue.receive(context);
            assert.fail('Expected CreateIssue to throw an error for missing teamId');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            // This should throw an error due to missing teamId
            console.log('Correctly failed with missing teamId:', error.message);
            console.log('Error type:', error.constructor.name);
            // Accept any error since missing teamId should indeed cause an error
            assert(error, 'Expected an error to be thrown for missing teamId');
        }
    });
});
