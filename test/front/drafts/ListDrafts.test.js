'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('ListDrafts Component', function() {
    let context;
    let ListDrafts;

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
        ListDrafts = require(path.join(__dirname, '../../../src/appmixer/front/drafts/ListDrafts/ListDrafts.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof ListDrafts, 'object');
            assert.strictEqual(typeof ListDrafts.receive, 'function');
        });
    });

    describe('Basic Functionality', function() {
        it('should list drafts successfully with default parameters', async function() {
            context.messages.in = {
                content: {}
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListDrafts.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');

            // Check if result is properly structured
            if (outputs[0].data.result) {
                assert(Array.isArray(outputs[0].data.result));
                assert.strictEqual(typeof outputs[0].data.count, 'number');
            }
        });

        it('should respect limit parameter', async function() {
            const testLimit = 5;

            context.messages.in = {
                content: {
                    limit: testLimit,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListDrafts.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');

            const result = outputs[0].data;
            if (result.result && result.result.length > 0) {
                // If there are drafts, they should not exceed the limit
                assert(result.result.length <= testLimit);

                // Verify each draft has expected properties
                result.result.forEach(draft => {
                    assert.strictEqual(typeof draft.id, 'string');
                    assert.strictEqual(draft.is_draft, true);
                    assert.strictEqual(typeof draft.body, 'string');
                    assert.strictEqual(typeof draft.created_at, 'number');
                });
            }
        });

        it('should handle different output types', async function() {
            const outputTypes = ['array', 'object', 'first'];

            for (const outputType of outputTypes) {
                await rateLimitDelay(); // Rate limiting between requests

                context.messages.in = {
                    content: {
                        outputType: outputType,
                        limit: 3
                    }
                };

                // Mock sendJson to capture the output
                const outputs = [];
                context.sendJson = (data, port) => {
                    outputs.push({ data, port });
                    return Promise.resolve();
                };

                await ListDrafts.receive(context);

                // Verify output structure varies by type
                assert.strictEqual(outputs.length, 1);
                assert.strictEqual(outputs[0].port, 'out');
                assert.strictEqual(typeof outputs[0].data, 'object');

                if (outputType === 'first' && outputs[0].data.result && outputs[0].data.result.length > 0) {
                    // First item should be a single draft object, not array
                    assert(!Array.isArray(outputs[0].data.result));
                    assert.strictEqual(typeof outputs[0].data.result.id, 'string');
                }
            }
        });
    });

    describe('Input Validation', function() {
        it('should handle invalid limit gracefully', async function() {
            context.messages.in = {
                content: {
                    limit: 150 // Above max of 100
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            // Should not throw error, but API might limit or ignore invalid values
            await ListDrafts.receive(context);

            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
        });

        it('should default to array output type when not specified', async function() {
            context.messages.in = {
                content: {
                    limit: 5
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListDrafts.receive(context);

            // Should handle default outputType properly
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
        });
    });

    describe('Draft Content Validation', function() {
        it('should return drafts with proper structure', async function() {
            context.messages.in = {
                content: {
                    limit: 1,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListDrafts.receive(context);

            const result = outputs[0].data;

            if (result.result && result.result.length > 0) {
                const draft = result.result[0];

                // Check required draft properties
                assert.strictEqual(typeof draft.id, 'string');
                assert.strictEqual(draft.is_draft, true);
                assert.strictEqual(typeof draft.body, 'string');
                assert.strictEqual(typeof draft.created_at, 'number');

                // Check optional properties if they exist
                if (draft.subject !== undefined) {
                    assert.strictEqual(typeof draft.subject, 'string');
                }

                if (draft.author) {
                    assert.strictEqual(typeof draft.author, 'object');
                    assert.strictEqual(typeof draft.author.id, 'string');
                }

                if (draft.conversation) {
                    assert.strictEqual(typeof draft.conversation.id, 'string');
                }
            }
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {}
            };

            try {
                await ListDrafts.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
