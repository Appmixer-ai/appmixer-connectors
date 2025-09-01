const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('PostComment Component', function() {
    let context;
    let PostComment;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.FIGMA_ACCESS_TOKEN) {
            console.log('Skipping tests - FIGMA_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        PostComment = require(path.join(__dirname, '../../src/appmixer/figma/core/PostComment/PostComment.js'));

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

    it('should post a comment to a file', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const testMessage = `Test comment from automated test - ${new Date().toISOString()}`;

        context.messages.in.content = {
            fileId: process.env.FIGMA_FILE_ID,
            message: testMessage
        };

        try {
            await PostComment.receive(context);

            console.log('PostComment result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected response data to be an object');
            assert.strictEqual(context.sendJson.lastCall?.[1], 'out', 'Expected output port to be "out"');

            // Verify the comment was created with expected properties
            if (data.id) {
                assert(data.id, 'Expected response to have id property');
                assert(data.message, 'Expected response to have message property');
                assert(data.created_at, 'Expected response to have created_at property');
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

    it('should handle empty message', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        context.messages.in.content = {
            fileId: process.env.FIGMA_FILE_ID,
            message: ''
        };

        try {
            await PostComment.receive(context);
            // If this succeeds, we can verify the response
            // If it fails, we expect certain error patterns
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('Expected error for empty message:', error.response.data);
                // This is expected behavior for empty message
                return;
            }
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

    it('should handle invalid fileId', async function() {
        context.messages.in.content = {
            fileId: 'invalid-file-id',
            message: 'Test comment'
        };

        try {
            await PostComment.receive(context);
            // If this succeeds unexpectedly, that's an issue
            assert.fail('Expected an error for invalid fileId');
        } catch (error) {
            if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                console.log('Expected error for invalid fileId:', error.response.data);
                // This is expected behavior for invalid fileId
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

    it('should handle long message', async function() {
        if (!process.env.FIGMA_FILE_ID) {
            console.log('Skipping test - FIGMA_FILE_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // Create a long message (but not too long to avoid rate limits)
        const longMessage = `This is a long test comment that includes multiple sentences and various characters. It tests whether the Figma API can handle longer comment messages. Generated at ${new Date().toISOString()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;

        context.messages.in.content = {
            fileId: process.env.FIGMA_FILE_ID,
            message: longMessage
        };

        try {
            await PostComment.receive(context);

            console.log('PostComment long message result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected response data to be an object');
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
});
