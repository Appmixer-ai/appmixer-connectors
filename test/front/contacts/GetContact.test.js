'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('GetContact Component', function() {
    let context;
    let GetContact;
    let testContactId;

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
        GetContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/GetContact/GetContact.js'));

        // Set up test contact ID
        testContactId = process.env.FRONT_TEST_CONTACT_ID || 'cnt_test';

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof GetContact, 'object');
            assert.strictEqual(typeof GetContact.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing contact ID', async function() {
            context.messages.in = {
                content: {}
            };

            try {
                await GetContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });

        it('should throw CancelError for empty contact ID', async function() {
            context.messages.in = {
                content: {
                    id: ''
                }
            };

            try {
                await GetContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });
    });

    describe('API Integration', function() {
        it('should retrieve a contact successfully', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    id: testContactId
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await GetContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(typeof outputs[0].data.name, 'string');
        });

        it('should handle non-existent contact (404)', async function() {
            const nonExistentId = 'cnt_nonexistent123';

            context.messages.in = {
                content: {
                    id: nonExistentId
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await GetContact.receive(context);

            // Should send to notFound port
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'notFound');
            assert.deepStrictEqual(outputs[0].data, {});
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {
                    id: 'cnt_test'
                }
            };

            try {
                await GetContact.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle malformed contact ID gracefully', async function() {
            context.messages.in = {
                content: {
                    id: 'invalid-id-format'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            try {
                await GetContact.receive(context);

                // If no error is thrown, it should go to notFound
                assert.strictEqual(outputs.length, 1);
                assert.strictEqual(outputs[0].port, 'notFound');
            } catch (error) {
                // Or it might throw an API error depending on the implementation
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
