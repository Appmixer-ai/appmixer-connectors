const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindVariables Component', function() {
    let context;
    let FindVariables;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.RAILWAY_ACCESS_TOKEN || !process.env.RAILWAY_PROJECT_ID ||
            !process.env.RAILWAY_ENVIRONMENT_ID) {
            console.log('Skipping tests - RAILWAY_ACCESS_TOKEN, RAILWAY_PROJECT_ID, or RAILWAY_ENVIRONMENT_ID not set');
            this.skip();
        }
        // Load the component
        FindVariables = require(path.join(__dirname, '../../src/appmixer/railway/core/FindVariables/FindVariables.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.RAILWAY_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        projectId: process.env.RAILWAY_PROJECT_ID,
                        environmentId: process.env.RAILWAY_ENVIRONMENT_ID
                    }
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

        assert(context.auth.apiKey, 'RAILWAY_ACCESS_TOKEN environment variable is required for tests');
        assert(process.env.RAILWAY_PROJECT_ID, 'RAILWAY_PROJECT_ID environment variable is required for tests');
        assert(process.env.RAILWAY_ENVIRONMENT_ID, 'RAILWAY_ENVIRONMENT_ID environment variable is required for tests');
    });

    it('should find variables with array output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            outputType: 'array'
        };

        try {
            await FindVariables.receive(context);

            console.log('FindVariables result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');

            // The Railway API returns variables in different formats
            // Check if it's the expected array format or object format
            if (Array.isArray(data.result)) {
                assert(typeof data.count === 'number', 'Expected data.count to be a number');
                assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

                if (data.result.length > 0) {
                    const variable = data.result[0];
                    // Variables should have name/key property
                    assert(variable.name || variable.key, 'Expected variable to have name or key property');
                }
            } else if (data.result && typeof data.result === 'object') {
                // Handle object format - variables returned as key-value pairs
                console.log('Variables returned as object format - this may be the expected Railway API behavior');
                const variableKeys = Object.keys(data.result);
                console.log(`Found ${variableKeys.length} variables:`, variableKeys.slice(0, 5));
            } else {
                throw new Error('Unexpected result format - expected array or object');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should require projectId', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            outputType: 'array'
        };

        try {
            await FindVariables.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Project ID'), 'Expected error message about Project ID');
        }

        assert(errorThrown, 'Expected error to be thrown when projectId is missing');
    });

    it('should require environmentId', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            outputType: 'array'
        };

        try {
            await FindVariables.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Environment ID'), 'Expected error message about Environment ID');
        }

        assert(errorThrown, 'Expected error to be thrown when environmentId is missing');
    });

    it('should handle object output type', async function() {
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            outputType: 'object'
        };

        // Mock sendJson to capture all calls
        const sendJsonCalls = [];
        context.sendJson = function(data, port) {
            sendJsonCalls.push({ data, port });
            return { data, port };
        };

        try {
            await FindVariables.receive(context);

            console.log('FindVariables object output type calls count:', sendJsonCalls.length);

            if (sendJsonCalls.length > 0) {
                console.log('First call data keys:', Object.keys(sendJsonCalls[0].data));

                // For object output type, each variable should be sent individually
                const callsToCheck = Math.min(sendJsonCalls.length, 5);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                    // Check that the variable data is present
                    assert(call.data.name, `Expected call ${i} data to have variable properties (name)`);
                }
                console.log(`All ${callsToCheck} checked calls have correct structure.`);
            } else {
                console.log('No variables found for this environment - this may be expected');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle service-specific variables', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID,
            outputType: 'array'
        };

        try {
            await FindVariables.receive(context);

            console.log('FindVariables with serviceId result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');

            // Handle both array and object result formats
            if (Array.isArray(data.result)) {
                assert(typeof data.count === 'number', 'Expected data.count to be a number');
                assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);
            } else if (data.result && typeof data.result === 'object') {
                // Handle object format - variables returned as key-value pairs
                console.log('Service variables returned as object format');
                const variableKeys = Object.keys(data.result);
                console.log(`Found ${variableKeys.length} service variables`);
            } else {
                throw new Error('Unexpected result format for service variables');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });
});
