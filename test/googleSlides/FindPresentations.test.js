const path = require('path');
const assert = require('assert');

describe('FindPresentations Component', function() {
    let context;
    let FindPresentations;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_SLIDES_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_SLIDES_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        FindPresentations = require(path.join(__dirname, '../../src/appmixer/googleSlides/core/FindPresentations/FindPresentations.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.GOOGLE_SLIDES_ACCESS_TOKEN
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

        assert(context.auth.accessToken, 'GOOGLE_SLIDES_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should find presentations without folder filter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindPresentations.receive(context);

            console.log('FindPresentations result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected sendJsonData.data to be an object');
            assert(Array.isArray(data.result), 'Expected sendJsonData.data.result to be an array');
            assert(typeof data.count === 'number', 'Expected sendJsonData.data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const presentation = data.result[0];
                assert(presentation.id, 'Expected presentation to have id property');
                assert(presentation.name, 'Expected presentation to have name property');
                assert.strictEqual(presentation.mimeType, 'application/vnd.google-apps.presentation', `Expected mimeType to be 'application/vnd.google-apps.presentation', got: ${presentation.mimeType}`);

                // Verify required fields are present
                const requiredFields = ['id', 'name', 'mimeType'];
                for (const field of requiredFields) {
                    assert(field in presentation, `Expected presentation to have ${field} property`);
                }
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
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
            await FindPresentations.receive(context);

            console.log('FindPresentations default output type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected sendJsonData.data to be an object');
            assert(Array.isArray(data.result), 'Expected sendJsonData.data.result to be an array');
            assert(typeof data.count === 'number', 'Expected sendJsonData.data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
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
            await FindPresentations.receive(context);

            console.log('FindPresentations object output type calls count:', sendJsonCalls.length);
            if (sendJsonCalls.length > 0) {
                console.log('First call data keys:', Object.keys(sendJsonCalls[0].data));
            }

            assert(sendJsonCalls.length > 0, 'Expected sendJson to be called at least once');

            // For object output type, each presentation should be sent individually
            // Let's just check the first few calls to avoid overwhelming output
            const callsToCheck = Math.min(sendJsonCalls.length, 5);
            for (let i = 0; i < callsToCheck; i++) {
                const call = sendJsonCalls[i];
                assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                // Check that the presentation data is present (should have presentation properties)
                assert(call.data.id && call.data.name && call.data.mimeType, `Expected call ${i} data to have presentation properties (id, name, mimeType)`);
            }
            console.log(`All ${callsToCheck} checked calls have correct structure.`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
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
            await FindPresentations.receive(context);

            console.log('FindPresentations first output type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected sendJsonData.data to be an object');
            assert(typeof data.index === 'number', 'Expected sendJsonData.data.index to be a number');
            assert(typeof data.count === 'number', 'Expected sendJsonData.data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No presentations found for first output type test - this is expected if no presentations exist');
                return; // This is acceptable
            }
            throw error;
        }
    });

    it('should generate output port options', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties = { generateOutputPortOptions: true };
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindPresentations.receive(context);

            console.log('FindPresentations output port options result:', JSON.stringify(data, null, 2));

            assert(Array.isArray(data), 'Expected output port options to be an array');
            if (data.length > 0) {
                const option = data[0];
                assert(option.label, 'Expected option to have label property');
                assert(option.value, 'Expected option to have value property');
                assert(option.schema, 'Expected option to have schema property');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle empty results gracefully', async function() {
        let data;
        let port;
        context.sendJson = function(output, outputPort) {
            data = output;
            port = outputPort;
        };

        // Use a folder ID that likely won't contain presentations to test empty results
        context.messages.in.content = {
            folderLocation: 'nonexistent-folder-id',
            outputType: 'array'
        };

        try {
            await FindPresentations.receive(context);

            // Should send to 'notFound' port when no results
            if (port === 'notFound') {
                assert(typeof data === 'object', 'Expected notFound data to be an object');
                console.log('Correctly handled empty results with notFound port');
            } else {
                // If it doesn't go to notFound, it should still be a valid array response
                assert(Array.isArray(data.result), 'Expected result to be an array');
                assert.strictEqual(data.result.length, 0, 'Expected empty result array');
            }
        } catch (error) {
            // 404 or similar errors are acceptable when testing with non-existent folder
            if (error.response && (error.response.status === 404 || error.response.status === 403)) {
                console.log('Expected error when accessing non-existent folder:', error.response.status);
                return;
            }
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });
});
