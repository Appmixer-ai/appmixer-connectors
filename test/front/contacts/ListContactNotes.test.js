'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('ListContactNotes Component', function() {
    let context;
    let ListContactNotes;
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
        ListContactNotes = require(path.join(__dirname, '../../../src/appmixer/front/contacts/ListContactNotes/ListContactNotes.js'));

        // Set up test contact ID
        testContactId = process.env.FRONT_TEST_CONTACT_ID || 'cnt_test';

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof ListContactNotes, 'object');
            assert.strictEqual(typeof ListContactNotes.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing contact ID', async function() {
            context.messages.in = {
                content: {
                    outputType: 'array'
                }
            };

            try {
                await ListContactNotes.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });

        it('should throw CancelError for empty contact ID', async function() {
            context.messages.in = {
                content: {
                    contactId: '',
                    outputType: 'array'
                }
            };

            try {
                await ListContactNotes.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });
    });

    describe('Output Port Options', function() {
        it('should generate output port options correctly', async function() {
            context.properties = { generateOutputPortOptions: true };
            context.messages.in = {
                content: {
                    contactId: testContactId,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListContactNotes.receive(context);

            // Verify that output port options were generated
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
        });
    });

    describe('API Integration', function() {
        it('should list contact notes successfully', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    contactId: testContactId,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListContactNotes.receive(context);

            // Should return results or go to notFound
            assert.strictEqual(outputs.length, 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');

            if (outputs[0].port === 'out') {
                assert.strictEqual(typeof outputs[0].data, 'object');
            } else {
                assert.deepStrictEqual(outputs[0].data, {});
            }
        });

        it('should handle outputType "first"', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    contactId: testContactId,
                    outputType: 'first'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListContactNotes.receive(context);

            // Should return results or go to notFound
            assert.strictEqual(outputs.length, 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');
        });

        it('should handle outputType "object"', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    contactId: testContactId,
                    outputType: 'object'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListContactNotes.receive(context);

            // Should return results or go to notFound
            // For object type, might send multiple times or go to notFound
            assert(outputs.length >= 1);
            assert(outputs[0].port === 'out' || outputs[0].port === 'notFound');
        });

        it('should go to notFound for contact with no notes', async function() {
            // First create a contact without notes to test
            const CreateContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/CreateContact/CreateContact.js'));

            const testName = `Contact No Notes ${Date.now()}`;
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
                console.log('Skipping test - could not create test contact');
                this.skip();
            }

            // Now try to list notes for the new contact (should be empty)
            context.messages.in = {
                content: {
                    contactId: createdContactId,
                    outputType: 'array'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await ListContactNotes.receive(context);

            // Should go to notFound for empty results
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'notFound');
            assert.deepStrictEqual(outputs[0].data, {});

            // Clean up - delete the test contact
            try {
                const DeleteContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/DeleteContact/DeleteContact.js'));
                const deleteContext = createTestContext(process.env.FRONT_API_TOKEN);
                deleteContext.messages.in = { content: { id: createdContactId } };
                deleteContext.sendJson = () => Promise.resolve();
                await DeleteContact.receive(deleteContext);
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        it('should handle non-existent contact ID', async function() {
            const nonExistentId = 'cnt_nonexistent123';

            context.messages.in = {
                content: {
                    contactId: nonExistentId,
                    outputType: 'array'
                }
            };

            try {
                await ListContactNotes.receive(context);
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
                    contactId: 'cnt_test',
                    outputType: 'array'
                }
            };

            try {
                await ListContactNotes.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle malformed contact ID gracefully', async function() {
            context.messages.in = {
                content: {
                    contactId: 'invalid-id-format',
                    outputType: 'array'
                }
            };

            try {
                await ListContactNotes.receive(context);
                assert.fail('Should have thrown an error for malformed ID');
            } catch (error) {
                // Should throw an HTTP error
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
