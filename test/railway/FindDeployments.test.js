const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindDeployments Component', function() {
    let context;
    let FindDeployments;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.RAILWAY_ACCESS_TOKEN || !process.env.RAILWAY_PROJECT_ID) {
            console.log('Skipping tests - RAILWAY_ACCESS_TOKEN or RAILWAY_PROJECT_ID not set');
            this.skip();
        }
        // Load the component
        FindDeployments = require(path.join(__dirname, '../../src/appmixer/railway/core/FindDeployments/FindDeployments.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.RAILWAY_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        projectId: process.env.RAILWAY_PROJECT_ID
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
    });

    it('should find deployments with array output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            outputType: 'array'
        };

        try {
            await FindDeployments.receive(context);

            console.log('FindDeployments result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const deployment = data.result[0];
                assert(deployment.id, 'Expected deployment to have id property');

                // Verify required fields are present
                const requiredFields = ['id'];
                for (const field of requiredFields) {
                    assert(field in deployment, `Expected deployment to have ${field} property`);
                }
            } else {
                console.log('No deployments found - this may be expected for a new project');
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
            outputType: 'array'
        };

        try {
            await FindDeployments.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Project ID'), 'Expected error message about Project ID');
        }

        assert(errorThrown, 'Expected error to be thrown when projectId is missing');
    });

    it('should handle service-specific deployments', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID,
            outputType: 'array'
        };

        try {
            await FindDeployments.receive(context);

            console.log('FindDeployments with serviceId result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const deployment = data.result[0];
                assert(deployment.id, 'Expected deployment to have id property');
                // If serviceId was specified, verify it matches (if available in response)
                if (deployment.serviceId) {
                    assert.strictEqual(deployment.serviceId, process.env.RAILWAY_SERVICE_ID, 'Expected deployment to belong to specified service');
                }
            } else {
                console.log('No deployments found for service - this may be expected');
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

    it('should handle environment-specific deployments', async function() {
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
            await FindDeployments.receive(context);

            console.log('FindDeployments with environmentId result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle object output type', async function() {
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            outputType: 'object'
        };

        // Mock sendJson to capture all calls
        const sendJsonCalls = [];
        context.sendJson = function(data, port) {
            sendJsonCalls.push({ data, port });
            return { data, port };
        };

        try {
            await FindDeployments.receive(context);

            console.log('FindDeployments object output type calls count:', sendJsonCalls.length);

            if (sendJsonCalls.length > 0) {
                console.log('First call data keys:', Object.keys(sendJsonCalls[0].data));

                // For object output type, each deployment should be sent individually
                const callsToCheck = Math.min(sendJsonCalls.length, 5);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                    // Check that the deployment data is present
                    assert(call.data.id, `Expected call ${i} data to have deployment properties (id)`);
                }
                console.log(`All ${callsToCheck} checked calls have correct structure.`);
            } else {
                console.log('No deployments found for object output type test - this may be expected');
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
