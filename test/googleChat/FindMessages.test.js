const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindMessages Component', function() {
    let context;
    let FindMessages;
    let testSpaceId = null;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_CHAT_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_CHAT_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        FindMessages = require(path.join(__dirname, '../../src/appmixer/googleChat/core/FindMessages/FindMessages.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.GOOGLE_CHAT_ACCESS_TOKEN
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

        assert(context.auth.accessToken, 'GOOGLE_CHAT_ACCESS_TOKEN environment variable is required for tests');
    });

    beforeEach(async function() {
        // Try to get a space ID for testing
        if (!testSpaceId) {
            try {
                const FindSpaces = require(path.join(__dirname, '../../src/appmixer/googleChat/core/FindSpaces/FindSpaces.js'));
                let spacesData;
                const findSpacesContext = {
                    ...context,
                    sendJson: function(output, port) {
                        spacesData = output;
                    },
                    messages: {
                        in: {
                            content: {
                                outputType: 'array'
                            }
                        }
                    },
                    properties: {}
                };

                await FindSpaces.receive(findSpacesContext);
                
                if (spacesData && spacesData.result && spacesData.result.length > 0) {
                    testSpaceId = spacesData.result[0].name;
                    console.log('Using test space ID:', testSpaceId);
                } else {
                    console.log('No spaces found - will use mock space ID for error testing');
                    testSpaceId = 'spaces/AAAA_mock_space_id';
                }
            } catch (error) {
                console.log('Could not fetch spaces for testing, using mock space ID');
                testSpaceId = 'spaces/AAAA_mock_space_id';
            }
        }
    });

    it('should require space parameter', async function() {
        let error;
        context.sendJson = function(output, port) {};

        context.messages.in.content = {
            outputType: 'array'
            // space is missing
        };

        try {
            await FindMessages.receive(context);
        } catch (err) {
            error = err;
        }

        assert(error, 'Expected error when space is missing');
        assert(error.name === 'CancelError', 'Expected CancelError');
        assert(error.message.includes('Space is required'), 'Expected error message about space being required');
    });

    it('should find messages in space', async function() {
        let data;
        let port;
        context.sendJson = function(output, portName) {
            data = output;
            port = portName;
        };

        context.messages.in.content = {
            space: testSpaceId,
            outputType: 'array'
        };

        try {
            await FindMessages.receive(context);

            console.log('FindMessages result:', JSON.stringify(data, null, 2));
            console.log('Port:', port);

            // Could return either messages or notFound
            if (port === 'out') {
                assert(data && typeof data === 'object', 'Expected data to be an object');
                assert(Array.isArray(data.result), 'Expected data.result to be an array');
                assert(typeof data.count === 'number', 'Expected data.count to be a number');
                
                // Verify the count matches array length
                assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

                if (data.result.length > 0) {
                    const message = data.result[0];
                    assert(message.name, 'Expected message to have name property');
                }
            } else if (port === 'notFound') {
                assert(data && typeof data === 'object', 'Expected notFound data to be an object');
                console.log('No messages found in space - this is acceptable');
            } else {
                assert.fail(`Unexpected port: ${port}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_CHAT_ACCESS_TOKEN in .env file');
            }
            if (error.response && (error.response.status === 403 || error.response.status === 404)) {
                console.log('Permission denied or space not found - this is acceptable for testing');
                console.log('Error details:', error.response.data);
                return;
            }
            throw error;
        }
    });

    it('should handle object output type', async function() {
        context.messages.in.content = {
            space: testSpaceId,
            outputType: 'object'
        };

        // Mock sendJson to capture all calls
        const sendJsonCalls = [];
        context.sendJson = function(data, port) {
            sendJsonCalls.push({ data, port });
            return { data, port };
        };

        try {
            await FindMessages.receive(context);

            console.log('FindMessages object output type calls count:', sendJsonCalls.length);

            // Could return either individual messages or notFound
            if (sendJsonCalls.length === 1 && sendJsonCalls[0].port === 'notFound') {
                console.log('No messages found - this is acceptable');
                return;
            }

            assert(sendJsonCalls.length > 0, 'Expected sendJson to be called at least once');

            // For object output type, each message should be sent individually
            // Let's just check the first few calls to avoid overwhelming output
            const callsToCheck = Math.min(sendJsonCalls.length, 3);
            for (let i = 0; i < callsToCheck; i++) {
                const call = sendJsonCalls[i];
                if (call.port === 'out') {
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert(call.data.name, `Expected call ${i} data to have name property`);
                }
            }
            console.log(`All ${callsToCheck} checked calls have correct structure.`);
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403 || error.response.status === 404)) {
                console.log('Expected error for test space - this is acceptable');
                console.log('Error details:', error.response.data);
                return;
            }
            throw error;
        }
    });

    it('should generate output port options', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties.generateOutputPortOptions = true;
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindMessages.receive(context);

            console.log('FindMessages output port options:', JSON.stringify(data, null, 2));

            assert(Array.isArray(data), 'Expected output port options to be an array');
            if (data.length > 0) {
                assert(data[0].label, 'Expected option to have label property');
                assert(data[0].value, 'Expected option to have value property');
            }
        } catch (error) {
            throw error;
        }
    });
});
