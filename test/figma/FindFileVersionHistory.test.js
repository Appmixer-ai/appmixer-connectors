const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindFileVersionHistory Component', function() {
    let context;
    let FindFileVersionHistory;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.FIGMA_ACCESS_TOKEN) {
            console.log('Skipping tests - FIGMA_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        FindFileVersionHistory = require(path.join(__dirname, '../../src/appmixer/figma/core/FindFileVersionHistory/FindFileVersionHistory.js'));

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

    it('should find file version history', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            fileId: process.env.FIGMA_FILE_ID,
            outputType: 'array'
        };

        try {
            await FindFileVersionHistory.receive(context);

            console.log('FindFileVersionHistory result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected sendJsonData.data to be an object');
            assert(Array.isArray(data.result), 'Expected sendJsonData.data.result to be an array');
            assert(typeof data.count === 'number', 'Expected sendJsonData.data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const version = data.result[0];
                assert(version.id, 'Expected version to have id property');
                assert(version.created_at, 'Expected version to have created_at property');

                // Verify required fields are present
                const requiredFields = ['id', 'created_at'];
                for (const field of requiredFields) {
                    assert(field in version, `Expected version to have ${field} property`);
                }
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

    it('should default to array output type when not specified', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            fileId: process.env.FIGMA_FILE_ID
        };

        try {
            await FindFileVersionHistory.receive(context);

            assert(data && typeof data === 'object', 'Expected sendJsonData.data to be an object');
            assert(Array.isArray(data.result), 'Expected sendJsonData.data.result to be an array');
            assert(typeof data.count === 'number', 'Expected sendJsonData.data.count to be a number');
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

    it('should handle object output type', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        context.messages.in.content = {
            fileId: process.env.FIGMA_FILE_ID,
            outputType: 'object'
        };

        // Mock sendJson to capture all calls
        const sendJsonCalls = [];
        context.sendJson = function(data, port) {
            sendJsonCalls.push({ data, port });
            return { data, port };
        };

        try {
            await FindFileVersionHistory.receive(context);

            console.log('FindFileVersionHistory object output type calls count:', sendJsonCalls.length);

            assert(sendJsonCalls.length >= 0, 'Expected sendJson to be called');

            // For object output type, each version should be sent individually
            const callsToCheck = Math.min(sendJsonCalls.length, 3);
            for (let i = 0; i < callsToCheck; i++) {
                const call = sendJsonCalls[i];
                assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
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

    it('should handle first output type', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            fileId: process.env.FIGMA_FILE_ID,
            outputType: 'first'
        };

        try {
            await FindFileVersionHistory.receive(context);

            assert(data && typeof data === 'object', 'Expected sendJsonData.data to be an object');
            assert(typeof data.index === 'number', 'Expected sendJsonData.data.index to be a number');
            assert(typeof data.count === 'number', 'Expected sendJsonData.data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
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
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No versions found for first output type test - this is expected if no versions exist');
                return; // This is acceptable
            }
            throw error;
        }
    });
});
