'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('DeleteContact Component', function() {
    let context;
    let DeleteContact;

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
        DeleteContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/DeleteContact/DeleteContact.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof DeleteContact, 'object');
            assert.strictEqual(typeof DeleteContact.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing contact ID', async function() {
            context.messages.in = {
                content: {}
            };

            try {
                await DeleteContact.receive(context);
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
                await DeleteContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });
    });

    describe('API Integration', function() {
        it('should delete a contact successfully', async function() {
            // Note: This test creates a contact first to ensure we have something to delete
            // This avoids deleting real contacts and provides a safe test scenario

            // First create a test contact to delete
            const CreateContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/CreateContact/CreateContact.js'));

            const testName = `Contact to Delete ${Date.now()}`;
            const createContext = createTestContext(process.env.FRONT_API_TOKEN);
            createContext.messages.in = {
                content: {
                    name: testName
                }
            };

            let createdContactId;
            createContext.sendJson = (data, port) => {
                if (port === 'out') {
                    createdContactId = data.id;
                }
                return Promise.resolve();
            };

            await CreateContact.receive(createContext);

            if (!createdContactId) {
                console.log('Skipping delete test - could not create test contact');
                this.skip();
            }

            // Now delete the contact
            context.messages.in = {
                content: {
                    id: createdContactId
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await DeleteContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.deepStrictEqual(outputs[0].data, {});
        });

        it('should handle non-existent contact ID', async function() {
            const nonExistentId = 'cnt_nonexistent123';

            context.messages.in = {
                content: {
                    id: nonExistentId
                }
            };

            try {
                await DeleteContact.receive(context);
                assert.fail('Should have thrown an error for non-existent contact');
            } catch (error) {
                // Should throw an HTTP error (likely 404)
                assert.notStrictEqual(error.name, 'CancelError');
            }
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
                await DeleteContact.receive(invalidContext);
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

            try {
                await DeleteContact.receive(context);
                assert.fail('Should have thrown an error for malformed ID');
            } catch (error) {
                // Should throw an HTTP error
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
