'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('ListComments Component', function() {
    let context;
    let ListComments;
    let testConversationId;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            console.log('Skipping tests - FRONT_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        ListComments = require(path.join(__dirname, '../../../src/appmixer/front/comments/ListComments/ListComments.js'));

        // Set up test conversation ID
        testConversationId = process.env.FRONT_TEST_CONVERSATION_ID || 'cnv_test';

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof ListComments, 'object');
            assert.strictEqual(typeof ListComments.receive, 'function');
        });
    });

    describe('Output Port Options Generation', function() {
        beforeEach(function() {
            context.properties.generateOutputPortOptions = true;
        });

        it('should return output port options for array type', async function() {
            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'array'
                }
            };

            await ListComments.receive(context);

            assert.ok(context.lastSent, 'Component should have sent output');
            const options = context.lastSent.data;
            assert.ok(Array.isArray(options), 'Options should be an array');

            const resultOption = options.find(opt => opt.value === 'result');
            assert.ok(resultOption, 'Should have result option');
            assert.strictEqual(resultOption.label, 'Comments');
            assert.ok(resultOption.schema, 'Should have schema');
            assert.strictEqual(resultOption.schema.type, 'array');
        });

        it('should return output port options for object type', async function() {
            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'object'
                }
            };

            await ListComments.receive(context);

            assert.ok(context.lastSent, 'Component should have sent output');
            const options = context.lastSent.data;
            assert.ok(Array.isArray(options), 'Options should be an array');
            assert.ok(options.length > 1, 'Should have multiple options for object type');

            // Check for index and count fields
            const indexOption = options.find(opt => opt.value === 'index');
            const countOption = options.find(opt => opt.value === 'count');
            assert.ok(indexOption, 'Should have index option');
            assert.ok(countOption, 'Should have count option');
        });

        it('should return output port options for file type', async function() {
            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'file'
                }
            };

            await ListComments.receive(context);

            assert.ok(context.lastSent, 'Component should have sent output');
            const options = context.lastSent.data;
            assert.ok(Array.isArray(options), 'Options should be an array');

            const fileIdOption = options.find(opt => opt.value === 'fileId');
            assert.ok(fileIdOption, 'Should have fileId option');
            assert.strictEqual(fileIdOption.label, 'File ID');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing conversationId', async function() {
            context.messages.in = {
                content: {
                    outputType: 'array'
                }
            };

            try {
                await ListComments.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Conversation ID is required.');
            }
        });
    });

    describe('API Integration', function() {
        it('should list comments successfully with array output', async function() {
            if (!testConversationId.startsWith('cnv_')) {
                this.skip('No valid test conversation ID provided');
            }

            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'array'
                }
            };

            try {
                await ListComments.receive(context);

                assert.ok(context.lastSent, 'Component should have sent output');
                assert.strictEqual(context.lastSent.outputPort, 'out');

                const result = context.lastSent.data;
                assert.ok(result.hasOwnProperty('result'), 'Result should have result property');
                assert.ok(result.hasOwnProperty('count'), 'Result should have count property');
                assert.ok(Array.isArray(result.result), 'Result should be an array');
                assert.strictEqual(typeof result.count, 'number', 'Count should be a number');

                if (result.result.length > 0) {
                    const comment = result.result[0];
                    assert.ok(comment.id, 'Comment should have ID');
                    assert.ok(comment.body !== undefined, 'Comment should have body');
                    assert.ok(comment.author, 'Comment should have author');
                    assert.ok(comment.created_at, 'Comment should have creation timestamp');
                }

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping integration test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should list comments successfully with object output', async function() {
            if (!testConversationId.startsWith('cnv_')) {
                this.skip('No valid test conversation ID provided');
            }

            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'object'
                }
            };

            // Create a mock sendJson that tracks all calls
            const sentOutputs = [];
            context.sendJson = function(data, outputPort) {
                sentOutputs.push({ data, outputPort });
                return Promise.resolve();
            };

            try {
                await ListComments.receive(context);

                if (sentOutputs.length > 0) {
                    // Check first output
                    const firstOutput = sentOutputs[0];
                    assert.strictEqual(firstOutput.outputPort, 'out');
                    assert.ok(firstOutput.data.hasOwnProperty('index'), 'Should have index property');
                    assert.ok(firstOutput.data.hasOwnProperty('count'), 'Should have count property');
                    assert.strictEqual(firstOutput.data.index, 0, 'First output should have index 0');
                    assert.ok(firstOutput.data.id, 'Should have comment ID');
                }

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping integration test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should return first comment only with first output type', async function() {
            if (!testConversationId.startsWith('cnv_')) {
                this.skip('No valid test conversation ID provided');
            }

            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'first'
                }
            };

            try {
                await ListComments.receive(context);

                assert.ok(context.lastSent, 'Component should have sent output');
                const result = context.lastSent.data;

                if (result && result.id) {
                    // If we got a result, verify it has the expected structure
                    assert.ok(result.hasOwnProperty('index'), 'Should have index property');
                    assert.ok(result.hasOwnProperty('count'), 'Should have count property');
                    assert.strictEqual(result.index, 0, 'Should be the first comment');
                    assert.ok(result.id, 'Should have comment ID');
                }

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping integration test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should save comments to file with file output type', async function() {
            if (!testConversationId.startsWith('cnv_')) {
                this.skip('No valid test conversation ID provided');
            }

            context.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'file'
                }
            };

            try {
                await ListComments.receive(context);

                assert.ok(context.lastSent, 'Component should have sent output');
                const result = context.lastSent.data;
                assert.ok(result.fileId, 'Should have fileId for file output');

            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log('Test conversation not found - skipping integration test');
                    this.skip();
                } else {
                    throw error;
                }
            }
        });

        it('should handle invalid conversation ID gracefully', async function() {
            context.messages.in = {
                content: {
                    conversationId: 'cnv_invalid_test_id',
                    outputType: 'array'
                }
            };

            try {
                await ListComments.receive(context);
                assert.fail('Should have thrown an error for invalid conversation ID');
            } catch (error) {
                assert.ok(error.response, 'Error should have response object');
                assert.strictEqual(error.response.status, 404);
            }
        });

        it('should handle authentication errors', async function() {
            const invalidContext = createTestContext('invalid_token');
            invalidContext.messages.in = {
                content: {
                    conversationId: testConversationId,
                    outputType: 'array'
                }
            };

            try {
                await ListComments.receive(invalidContext);
                assert.fail('Should have thrown an authentication error');
            } catch (error) {
                assert.ok(error.response, 'Error should have response object');
                assert.strictEqual(error.response.status, 401);
            }
        });
    });
});
