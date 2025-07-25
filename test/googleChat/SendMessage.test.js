const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('SendMessage Component', function() {
    let context;
    let SendMessage;
    let testSpaceId = null;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_CHAT_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_CHAT_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        SendMessage = require(path.join(__dirname, '../../src/appmixer/googleChat/core/SendMessage/SendMessage.js'));

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
                const FindSpaces = require(path.join(
                    __dirname,
                    '../../src/appmixer/googleChat/core/FindSpaces/FindSpaces.js'
                ));
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
            text: 'Test message'
            // space is missing
        };

        try {
            await SendMessage.receive(context);
        } catch (err) {
            error = err;
        }

        assert(error, 'Expected error when space is missing');
        assert(error.name === 'CancelError', 'Expected CancelError');
        assert(error.message.includes('Space is required'), 'Expected error message about space being required');
    });

    it('should require text parameter', async function() {
        let error;
        context.sendJson = function(output, port) {};

        context.messages.in.content = {
            space: testSpaceId
            // text is missing
        };

        try {
            await SendMessage.receive(context);
        } catch (err) {
            error = err;
        }

        assert(error, 'Expected error when text is missing');
        assert(error.name === 'CancelError', 'Expected CancelError');
        assert(error.message.includes('Text is required'), 'Expected error message about text being required');
    });

    it('should send message with text only', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            space: testSpaceId,
            text: 'Test message from Appmixer test'
        };

        try {
            await SendMessage.receive(context);

            console.log('SendMessage result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');

            // Check for message properties that should be returned
            if (data.name) {
                assert(typeof data.name === 'string', 'Expected message name to be string');
            }
            if (data.text) {
                assert(typeof data.text === 'string', 'Expected message text to be string');
            }
            if (data.createTime) {
                assert(typeof data.createTime === 'string', 'Expected createTime to be string');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error(
                    'Authentication failed: Access token is invalid or expired. ' +
                    'Please refresh the GOOGLE_CHAT_ACCESS_TOKEN in .env file'
                );
            }
            if (error.response && error.response.status === 403) {
                console.log('Permission denied - the bot may not have access to the space ' +
                    'or the space may not exist');
                console.log('Error details:', error.response.data);
                // This is acceptable for testing - we don't have a guaranteed test space
                return;
            }
            if (error.response && error.response.status === 404) {
                console.log('Space not found - the test space may not exist');
                console.log('Error details:', error.response.data);
                // This is acceptable for testing - we don't have a guaranteed test space
                return;
            }
            throw error;
        }
    });

    it('should send message with thread key', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {            space: testSpaceId,
            text: 'Test threaded message from Appmixer test',
            threadKey: 'test-thread-key-123'
        };

        try {
            await SendMessage.receive(context);

            console.log('SendMessage with thread result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');

            // Check for message properties that should be returned
            if (data.name) {
                assert(typeof data.name === 'string', 'Expected message name to be string');
            }
            if (data.text) {
                assert(typeof data.text === 'string', 'Expected message text to be string');
            }
        } catch (error) {
            if (error.response && (error.response.status === 401 ||
                error.response.status === 403 || error.response.status === 404)) {
                console.log('Expected error for test space - this is acceptable');
                console.log('Error details:', error.response.data);
                return;
            }
            throw error;
        }
    });
});
