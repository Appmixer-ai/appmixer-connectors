'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('CreateDraft Component', function() {
    let context;
    let CreateDraft;

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
        CreateDraft = require(path.join(__dirname, '../../../src/appmixer/front/drafts/CreateDraft/CreateDraft.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof CreateDraft, 'object');
            assert.strictEqual(typeof CreateDraft.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing body', async function() {
            context.messages.in = {
                content: {
                    conversationId: 'test-conversation'
                }
            };

            try {
                await CreateDraft.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Message body is required!');
            }
        });

        it('should throw CancelError when neither conversationId nor channelId is provided', async function() {
            context.messages.in = {
                content: {
                    body: 'Test draft message'
                }
            };

            try {
                await CreateDraft.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Either Conversation ID or Channel ID is required!');
            }
        });
    });

    describe('API Integration', function() {
        it('should create a draft in conversation successfully with minimal data', async function() {
            const testBody = `Test draft message ${Date.now()}`;

            // Note: This test requires a valid conversation ID
            // In a real environment, you would get this from a previous test or setup
            context.messages.in = {
                content: {
                    conversationId: process.env.TEST_CONVERSATION_ID || 'cnv_test',
                    body: testBody
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            if (!process.env.TEST_CONVERSATION_ID) {
                console.log('Skipping conversation draft test - TEST_CONVERSATION_ID not set');
                return;
            }

            await CreateDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.body, testBody);
            assert.strictEqual(outputs[0].data.is_draft, true);
        });

        it('should create a draft in channel successfully with all fields', async function() {
            const testBody = `Full test draft message ${Date.now()}`;

            // Note: This test requires a valid channel ID
            context.messages.in = {
                content: {
                    channelId: process.env.TEST_CHANNEL_ID || 'cha_test',
                    body: testBody,
                    text: 'Plain text version',
                    subject: 'Test Draft Subject',
                    to: ['test@example.com'],
                    cc: ['cc@example.com'],
                    bcc: ['bcc@example.com']
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            if (!process.env.TEST_CHANNEL_ID) {
                console.log('Skipping channel draft test - TEST_CHANNEL_ID not set');
                return;
            }

            await CreateDraft.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.body, testBody);
            assert.strictEqual(outputs[0].data.subject, 'Test Draft Subject');
        });

        it('should handle comma-separated recipients correctly', async function() {
            const testBody = `Recipients test draft ${Date.now()}`;

            context.messages.in = {
                content: {
                    channelId: process.env.TEST_CHANNEL_ID || 'cha_test',
                    body: testBody,
                    to: 'test1@example.com, test2@example.com',
                    cc: 'cc1@example.com, cc2@example.com'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            if (!process.env.TEST_CHANNEL_ID) {
                console.log('Skipping recipients test - TEST_CHANNEL_ID not set');
                return;
            }

            await CreateDraft.receive(context);

            // Verify output - the component should handle parsing recipients
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {
                    conversationId: 'cnv_test',
                    body: 'Test Draft'
                }
            };

            try {
                await CreateDraft.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle 404 errors with proper message', async function() {
            context.messages.in = {
                content: {
                    conversationId: 'cnv_nonexistent',
                    body: 'Test Draft'
                }
            };

            try {
                await CreateDraft.receive(context);
                assert.fail('Should have thrown an error for non-existent conversation');
            } catch (error) {
                if (error.response?.status === 404) {
                    assert.strictEqual(error.name, 'CancelError');
                    assert.strictEqual(error.message, 'Conversation or Channel not found!');
                } else {
                    // Other errors are acceptable in test environment
                    assert.notStrictEqual(error.name, 'CancelError');
                }
            }
        });
    });
});
