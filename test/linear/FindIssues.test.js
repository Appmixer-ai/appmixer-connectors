const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindIssues Component', function() {
    let context;
    let FindIssues;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.LINEAR_ACCESS_TOKEN) {
            console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindIssues = require(path.join(__dirname, '../../src/appmixer/linear/core/FindIssues/FindIssues.js'));

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
            properties: {},
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

    it('should find issues without search query', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindIssues.receive(context);

            console.log('FindIssues result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const issue = data.result[0];
                assert(issue.id, 'Expected issue to have id property');
                assert(issue.title, 'Expected issue to have title property');

                // Verify required fields are present
                const requiredFields = ['id', 'title', 'createdAt', 'updatedAt'];
                for (const field of requiredFields) {
                    assert(field in issue, `Expected issue to have ${field} property`);
                }

                // Verify nested objects if they exist
                if (issue.state) {
                    assert(issue.state.id, 'Expected state to have id property');
                    assert(issue.state.name, 'Expected state to have name property');
                }

                if (issue.team) {
                    assert(issue.team.id, 'Expected team to have id property');
                    assert(issue.team.name, 'Expected team to have name property');
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

    it('should default to array output type when not specified', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {};

        try {
            await FindIssues.receive(context);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should find issues with search query', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            query: 'bug',
            outputType: 'array'
        };

        try {
            await FindIssues.receive(context);

            console.log('FindIssues with search query result count:', data ? data.count : 0);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            // If results found, verify they are valid issues
            if (data.result.length > 0) {
                const issue = data.result[0];
                assert(issue.id, 'Expected issue to have id property');
                assert(issue.title, 'Expected issue to have title property');
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

    it('should handle object output type', async function() {
        context.messages.in.content = {
            outputType: 'object'
        };

        // Mock sendJson to capture all calls
        const sendJsonCalls = [];
        context.sendJson = function(data, port) {
            sendJsonCalls.push({ data, port });
            return { data, port };
        };

        try {
            await FindIssues.receive(context);

            console.log('FindIssues object output type calls count:', sendJsonCalls.length);

            if (sendJsonCalls.length > 0) {
                // For object output type, each issue should be sent individually
                const callsToCheck = Math.min(sendJsonCalls.length, 3);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                    // Check that the issue data is present
                    assert(call.data.id && call.data.title, `Expected call ${i} data to have issue properties (id, title)`);
                }
                console.log(`All ${callsToCheck} checked calls have correct structure.`);
            } else {
                console.log('No issues found for object output type test');
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

    it('should handle first output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'first'
        };

        try {
            await FindIssues.receive(context);

            if (data) {
                console.log('FindIssues first output type result keys:', Object.keys(data));

                assert(data && typeof data === 'object', 'Expected data to be an object');
                assert(typeof data.index === 'number', 'Expected data.index to be a number');
                assert(typeof data.count === 'number', 'Expected data.count to be a number');
                assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
                assert(data.id, 'Expected first issue to have id property');
                assert(data.title, 'Expected first issue to have title property');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No issues found for first output type test - this is expected if no issues exist');
                return; // This is acceptable
            }
            throw error;
        }
    });

    it('should handle generateOutputPortOptions', async function() {
        context.properties = {
            generateOutputPortOptions: true
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        let result;
        context.sendJson = function(output, port) {
            result = output;
        };

        try {
            await FindIssues.receive(context);

            assert(result && typeof result === 'object', 'Expected result to be an object');
            // The exact structure depends on the lib.getOutputPortOptions implementation
            console.log('Output port options result:', JSON.stringify(result, null, 2));
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the LINEAR_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });
});
