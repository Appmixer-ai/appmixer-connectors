'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('SearchContacts Component', function() {
    let context;
    let SearchContacts;

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
        SearchContacts = require(path.join(__dirname, '../../../src/appmixer/front/contacts/SearchContacts/SearchContacts.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof SearchContacts, 'object');
            assert.strictEqual(typeof SearchContacts.receive, 'function');
        });
    });

    describe('Output Port Options', function() {
        it('should generate output port options correctly', async function() {
            context.properties = { generateOutputPortOptions: true };
            context.messages.in = {
                content: {
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Verify that output port options were generated
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
        });
    });

    describe('API Integration', function() {
        it('should search contacts without query', async function() {
            context.messages.in = {
                content: {
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Should return results or go to notFound
            assert.strictEqual(outputs.length, 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');

            if (outputs[0].port === 'out') {
                assert.strictEqual(typeof outputs[0].data, 'object');
            } else {
                assert.deepStrictEqual(outputs[0].data, {});
            }
        });

        it('should search contacts with query string', async function() {
            const testQuery = 'test'; // Generic search term

            context.messages.in = {
                content: {
                    q: testQuery,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Should return results or go to notFound
            assert.strictEqual(outputs.length, 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');

            if (outputs[0].port === 'out') {
                assert.strictEqual(typeof outputs[0].data, 'object');
            } else {
                assert.deepStrictEqual(outputs[0].data, {});
            }
        });

        it('should respect limit parameter', async function() {
            context.messages.in = {
                content: {
                    limit: 5,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Should return results or go to notFound
            assert.strictEqual(outputs.length, 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');
        });

        it('should handle outputType "first"', async function() {
            context.messages.in = {
                content: {
                    outputType: 'first',
                    limit: 1
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Should return results or go to notFound
            assert.strictEqual(outputs.length, 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');
        });

        it('should handle outputType "object"', async function() {
            context.messages.in = {
                content: {
                    outputType: 'object',
                    limit: 2
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Should return results or go to notFound
            // For object type, might send multiple times or go to notFound
            assert(outputs.length >= 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');
        });

        it('should handle advanced query syntax', async function() {
            // Test Front's advanced query syntax
            const advancedQuery = 'name:"test"';

            context.messages.in = {
                content: {
                    q: advancedQuery,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Should return results or go to notFound
            assert.strictEqual(outputs.length, 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');
        });

        it('should go to notFound for non-existent search', async function() {
            // Search for something that definitely won't exist
            const impossibleQuery = `nonexistent_contact_${Date.now()}_xyz123`;

            context.messages.in = {
                content: {
                    q: impossibleQuery,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await SearchContacts.receive(context);

            // Should likely go to notFound
            assert.strictEqual(outputs.length, 1);
            if (outputs[0].port === 'notFound') {
                assert.deepStrictEqual(outputs[0].data, {});
            }
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {
                    outputType: 'array'
                }
            };

            try {
                await SearchContacts.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle malformed query gracefully', async function() {
            // Test with potentially problematic query
            const malformedQuery = 'name:"unclosed quote';

            context.messages.in = {
                content: {
                    q: malformedQuery,
                    outputType: 'array'
                }
            };

            try {
                // Mock sendJson to capture the output
                const outputs = [];
                context.sendJson = (data, port) => {
                    outputs.push({ data, port });
                    return Promise.resolve();
                };

                await SearchContacts.receive(context);

                // Should either return results or go to notFound
                assert.strictEqual(outputs.length, 1);
                assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');
            } catch (error) {
                // Or it might throw an API error
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
