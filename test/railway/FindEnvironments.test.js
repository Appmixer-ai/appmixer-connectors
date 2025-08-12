const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindEnvironments Component', function() {
    let context;
    let FindEnvironments;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.RAILWAY_ACCESS_TOKEN || !process.env.RAILWAY_PROJECT_ID) {
            console.log('Skipping tests - RAILWAY_ACCESS_TOKEN or RAILWAY_PROJECT_ID not set');
            this.skip();
        }
        // Load the component
        FindEnvironments = require(path.join(__dirname, '../../src/appmixer/railway/core/FindEnvironments/FindEnvironments.js'));

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

    it('should find environments with array output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            outputType: 'array'
        };

        try {
            await FindEnvironments.receive(context);

            console.log('FindEnvironments result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const environment = data.result[0];
                assert(environment.id, 'Expected environment to have id property');
                assert(environment.name, 'Expected environment to have name property');

                // Verify required fields are present
                const requiredFields = ['id', 'name'];
                for (const field of requiredFields) {
                    assert(field in environment, `Expected environment to have ${field} property`);
                }
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
            await FindEnvironments.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Project ID'), 'Expected error message about Project ID');
        }

        assert(errorThrown, 'Expected error to be thrown when projectId is missing');
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
            await FindEnvironments.receive(context);

            console.log('FindEnvironments object output type calls count:', sendJsonCalls.length);

            if (sendJsonCalls.length > 0) {
                console.log('First call data keys:', Object.keys(sendJsonCalls[0].data));

                // For object output type, each environment should be sent individually
                const callsToCheck = Math.min(sendJsonCalls.length, 5);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                    // Check that the environment data is present
                    assert(call.data.id && call.data.name, `Expected call ${i} data to have environment properties (id, name)`);
                }
                console.log(`All ${callsToCheck} checked calls have correct structure.`);
            } else {
                console.log('No environments found for this project - this may be expected');
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

    it('should handle first output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            outputType: 'first'
        };

        try {
            await FindEnvironments.receive(context);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.index === 'number', 'Expected data.index to be a number');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No environments found for first output type test - this is expected if no environments exist');
                return; // This is acceptable
            }
            throw error;
        }
    });
});
