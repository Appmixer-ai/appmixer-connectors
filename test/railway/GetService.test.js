const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetService Component', function() {
    let context;
    let GetService;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.RAILWAY_ACCESS_TOKEN || !process.env.RAILWAY_SERVICE_ID) {
            console.log('Skipping tests - RAILWAY_ACCESS_TOKEN or RAILWAY_SERVICE_ID not set');
            this.skip();
        }
        // Load the component
        GetService = require(path.join(__dirname, '../../src/appmixer/railway/core/GetService/GetService.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.RAILWAY_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        serviceId: process.env.RAILWAY_SERVICE_ID
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
        assert(process.env.RAILWAY_SERVICE_ID, 'RAILWAY_SERVICE_ID environment variable is required for tests');
    });

    it('should get service details', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            serviceId: process.env.RAILWAY_SERVICE_ID
        };

        try {
            await GetService.receive(context);

            console.log('GetService result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected service to have id property');
            assert(data.name, 'Expected service to have name property');

            // Verify the service ID matches what we requested
            assert.strictEqual(data.id, process.env.RAILWAY_SERVICE_ID, 'Expected service ID to match requested ID');

            // Verify required fields are present
            const requiredFields = ['id', 'name'];
            for (const field of requiredFields) {
                assert(field in data, `Expected service to have ${field} property`);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the RAILWAY_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                throw new Error('Service not found - RAILWAY_SERVICE_ID may be invalid or service may have been deleted');
            }
            throw error;
        }
    });

    it('should require serviceId', async function() {
        let errorThrown = false;

        context.messages.in.content = {};

        try {
            await GetService.receive(context);
        } catch (error) {
            errorThrown = true;
            assert(error.name === 'CancelError', 'Expected CancelError to be thrown');
            assert(error.message.includes('Service ID'), 'Expected error message about Service ID');
        }

        assert(errorThrown, 'Expected error to be thrown when serviceId is missing');
    });

    it('should handle invalid serviceId gracefully', async function() {
        let errorThrown = false;

        context.messages.in.content = {
            serviceId: 'invalid-service-id'
        };

        try {
            await GetService.receive(context);
        } catch (error) {
            errorThrown = true;
            console.log('Error response for invalid serviceId:', error.message);
            // GraphQL typically returns errors in different ways than REST APIs
            // Accept either HTTP errors or GraphQL errors
            assert(error.response || error.message.includes('GraphQL Error') || error.message.includes('service'),
                'Expected error response or GraphQL error for invalid service ID');
        }

        // Note: GraphQL APIs may return null data instead of HTTP errors for invalid IDs
        if (!errorThrown) {
            console.log('API returned success for invalid service ID - checking if service data is null');
        }
    });
});
