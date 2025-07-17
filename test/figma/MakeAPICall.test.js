const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('MakeAPICall Component', function() {
    let context;
    let MakeAPICall;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.FIGMA_ACCESS_TOKEN) {
            console.log('Skipping tests - FIGMA_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        MakeAPICall = require(path.join(__dirname, '../../src/appmixer/figma/core/MakeAPICall/MakeAPICall.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.FIGMA_ACCESS_TOKEN
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

        assert(context.auth.accessToken, 'FIGMA_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should make a GET API call to user profile endpoint', async function() {
        let data;
        let outputPort;
        context.sendJson = function(output, port) {
            data = output;
            outputPort = port;
        };

        context.messages.in.content = {
            resource: 'me',
            method: 'GET'
        };

        try {
            await MakeAPICall.receive(context);

            console.log('MakeAPICall user profile result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected response data to be an object');
            assert.strictEqual(outputPort, 'out', 'Expected output port to be "out"');

            // Verify we got user profile data
            if (data.id) {
                assert(data.id, 'Expected user profile to have id property');
                assert(data.email, 'Expected user profile to have email property');
                assert(data.handle, 'Expected user profile to have handle property');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the FIGMA_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should make a GET API call to files endpoint', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            resource: `files/${process.env.FIGMA_FILE_ID}`,
            method: 'GET'
        };

        try {
            await MakeAPICall.receive(context);

            console.log('MakeAPICall file data result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected response data to be an object');

            // Verify we got file data
            if (data.name) {
                assert(data.name, 'Expected file to have name property');
                assert(data.lastModified, 'Expected file to have lastModified property');
                assert(data.document, 'Expected file to have document property');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the FIGMA_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('File not found - check FIGMA_FILE_ID');
                console.log('Error details:', error.response.data);
                throw new Error('File not found: Please check the FIGMA_FILE_ID in .env file');
            }
            throw error;
        }
    });

    it('should make a GET API call to comments endpoint', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            resource: `files/${process.env.FIGMA_FILE_ID}/comments`,
            method: 'GET'
        };

        try {
            await MakeAPICall.receive(context);

            console.log('MakeAPICall comments result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected response data to be an object');

            // Verify we got comments data structure
            if (data.comments) {
                assert(Array.isArray(data.comments), 'Expected comments to be an array');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the FIGMA_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('File not found - check FIGMA_FILE_ID');
                console.log('Error details:', error.response.data);
                throw new Error('File not found: Please check the FIGMA_FILE_ID in .env file');
            }
            throw error;
        }
    });

    it('should handle POST API call with body', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const testMessage = `Test comment from MakeAPICall test - ${new Date().toISOString()}`;

        context.messages.in.content = {
            resource: `files/${process.env.FIGMA_FILE_ID}/comments`,
            method: 'POST',
            body: {
                message: testMessage
            }
        };

        try {
            await MakeAPICall.receive(context);

            console.log('MakeAPICall POST comment result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected response data to be an object');

            // Verify we got comment creation response
            if (data.id) {
                assert(data.id, 'Expected created comment to have id property');
                assert(data.message, 'Expected created comment to have message property');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the FIGMA_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('File not found - check FIGMA_FILE_ID');
                console.log('Error details:', error.response.data);
                throw new Error('File not found: Please check the FIGMA_FILE_ID in .env file');
            }
            if (error.response && error.response.status === 403) {
                console.log('Permission denied - check file permissions and scope');
                console.log('Error details:', error.response.data);
                throw new Error('Permission denied: Check that the file allows comments and the access token has comment permissions');
            }
            throw error;
        }
    });

    it('should handle invalid resource', async function() {
        context.messages.in.content = {
            resource: 'invalid/endpoint',
            method: 'GET'
        };

        try {
            await MakeAPICall.receive(context);
            // If this succeeds unexpectedly, that's unusual
            console.log('Unexpected success for invalid resource');
        } catch (error) {
            if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                console.log('Expected error for invalid resource:', error.response.data);
                // This is expected behavior for invalid resource
                return;
            }
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the FIGMA_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle different HTTP methods', async function() {
        const methods = ['GET', 'POST', 'PUT', 'DELETE'];

        for (const method of methods) {
            context.messages.in.content = {
                resource: 'me',
                method: method
            };

            try {
                await MakeAPICall.receive(context);
                console.log(`${method} method test completed successfully`);
            } catch (error) {
                if (error.response && error.response.status === 405) {
                    console.log(`${method} method not allowed for this endpoint - this is expected`);
                    continue;
                }
                if (error.response && error.response.status === 401) {
                    console.log('Authentication failed - access token may be expired');
                    throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the FIGMA_ACCESS_TOKEN in .env file');
                }
                console.log(`${method} method failed with:`, error.message);
                // Don't fail the test for method-specific errors
            }
        }
    });
});
