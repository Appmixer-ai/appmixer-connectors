const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('SetVariable Component', function() {
    let context;
    let SetVariable;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.RAILWAY_ACCESS_TOKEN || !process.env.RAILWAY_PROJECT_ID ||
            !process.env.RAILWAY_ENVIRONMENT_ID) {
            console.log('Skipping tests - RAILWAY_ACCESS_TOKEN, RAILWAY_PROJECT_ID, or RAILWAY_ENVIRONMENT_ID not set');
            this.skip();
        }
        // Load the component
        SetVariable = require(path.join(__dirname, '../../src/appmixer/railway/core/SetVariable/SetVariable.js'));

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

    it('should set a new environment variable', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const testVariableName = `TEST_VAR_${Date.now()}`;
        const testVariableValue = 'test-value-123';

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            variableName: testVariableName,
            variableValue: testVariableValue
        };

        try {
            await SetVariable.receive(context);

            console.log('SetVariable result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            // Update operations should return empty object
            assert(Object.keys(data).length === 0, 'Expected empty object for update operation');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should set a service-specific variable', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const testVariableName = `SERVICE_VAR_${Date.now()}`;
        const testVariableValue = 'service-test-value-456';

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID,
            variableName: testVariableName,
            variableValue: testVariableValue
        };

        try {
            await SetVariable.receive(context);

            console.log('SetVariable (service-specific) result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            // Update operations should return empty object
            assert(Object.keys(data).length === 0, 'Expected empty object for update operation');
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
            variableName: 'TEST_VAR',
            variableValue: 'test-value'
        };

        try {
            await SetVariable.receive(context);
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
            variableName: 'TEST_VAR',
            variableValue: 'test-value'
        };

        try {
            await SetVariable.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Environment ID'), 'Expected error message about Environment ID');
        }

        assert(errorThrown, 'Expected error to be thrown when environmentId is missing');
    });

    it('should require variable name', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            value: 'test-value'
        };

        try {
            await SetVariable.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Variable Name'), 'Expected error message about Variable Name');
        }

        assert(errorThrown, 'Expected error to be thrown when variable name is missing');
    });

    it('should require variable value', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            variableName: 'TEST_VAR'
        };

        try {
            await SetVariable.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Variable Value'), 'Expected error message about Variable Value');
        }

        assert(errorThrown, 'Expected error to be thrown when variable value is missing');
    });

    it('should update an existing variable', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const testVariableName = `UPDATE_VAR_${Date.now()}`;
        const initialValue = 'initial-value';
        const updatedValue = 'updated-value';

        // First, create the variable
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            variableName: testVariableName,
            variableValue: initialValue
        };

        await SetVariable.receive(context);

        // Then, update it
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            variableName: testVariableName,
            variableValue: updatedValue
        };

        try {
            await SetVariable.receive(context);

            console.log('SetVariable (update) result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            // Update operations should return empty object
            assert(Object.keys(data).length === 0, 'Expected empty object for update operation');
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
