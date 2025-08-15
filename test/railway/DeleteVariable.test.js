const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('DeleteVariable Component', function() {
    let context;
    let DeleteVariable;
    let SetVariable;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.RAILWAY_ACCESS_TOKEN || !process.env.RAILWAY_PROJECT_ID ||
            !process.env.RAILWAY_ENVIRONMENT_ID) {
            console.log('Skipping tests - RAILWAY_ACCESS_TOKEN, RAILWAY_PROJECT_ID, or RAILWAY_ENVIRONMENT_ID not set');
            this.skip();
        }
        // Load the components
        DeleteVariable = require(path.join(__dirname, '../../src/appmixer/railway/core/DeleteVariable/DeleteVariable.js'));
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

    it('should delete an existing environment variable', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const testVariableName = `DELETE_TEST_VAR_${Date.now()}`;
        const testVariableValue = 'delete-test-value';

        // First, create the variable to delete
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            variableName: testVariableName,
            variableValue: testVariableValue
        };

        await SetVariable.receive(context);

        // Now delete it
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID, // Required field
            variableName: testVariableName
        };

        try {
            await DeleteVariable.receive(context);

            console.log('DeleteVariable result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            // Delete operations should return empty object
            assert(Object.keys(data).length === 0, 'Expected empty object for delete operation');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should delete a service-specific variable', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const testVariableName = `DELETE_SERVICE_VAR_${Date.now()}`;
        const testVariableValue = 'delete-service-test-value';

        // First, create the service-specific variable to delete
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID,
            variableName: testVariableName,
            variableValue: testVariableValue
        };

        await SetVariable.receive(context);

        // Now delete it
        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID,
            variableName: testVariableName
        };

        try {
            await DeleteVariable.receive(context);

            console.log('DeleteVariable (service-specific) result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            // Delete operations should return empty object
            assert(Object.keys(data).length === 0, 'Expected empty object for delete operation');
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
            serviceId: process.env.RAILWAY_SERVICE_ID,
            variableName: 'TEST_VAR'
        };

        try {
            await DeleteVariable.receive(context);
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
            serviceId: process.env.RAILWAY_SERVICE_ID,
            variableName: 'TEST_VAR'
        };

        try {
            await DeleteVariable.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Environment ID'), 'Expected error message about Environment ID');
        }

        assert(errorThrown, 'Expected error to be thrown when environmentId is missing');
    });

    it('should require serviceId', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            variableName: 'TEST_VAR'
        };

        try {
            await DeleteVariable.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Service ID'), 'Expected error message about Service ID');
        }

        assert(errorThrown, 'Expected error to be thrown when serviceId is missing');
    });

    it('should require variable name', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID
        };

        try {
            await DeleteVariable.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Variable name'), 'Expected error message about Variable name');
        }

        assert(errorThrown, 'Expected error to be thrown when variable name is missing');
    });

    it('should handle deleting non-existent variable gracefully', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            projectId: process.env.RAILWAY_PROJECT_ID,
            environmentId: process.env.RAILWAY_ENVIRONMENT_ID,
            serviceId: process.env.RAILWAY_SERVICE_ID,
            variableName: 'NON_EXISTENT_VARIABLE_NAME_12345'
        };

        try {
            await DeleteVariable.receive(context);
        } catch (error) {
            errorThrown = true;
            // Should get either a 404 or some other error for non-existent variable
            console.log('Expected error when deleting non-existent variable:', error.message);
            assert(error.response || error.name === 'CancelError', 'Expected error response or CancelError for non-existent variable');
        }

        // Note: Some APIs may return success even for non-existent variables, so we don't assert errorThrown
        if (!errorThrown) {
            console.log('API returned success for non-existent variable deletion - this may be expected behavior');
        }
    });
});
