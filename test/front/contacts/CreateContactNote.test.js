'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('CreateContactNote Component', function() {
    let context;
    let CreateContactNote;
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
        CreateContactNote = require(path.join(__dirname, '../../../src/appmixer/front/contacts/CreateContactNote/CreateContactNote.js'));

        // Set up test contact ID
        testContactId = process.env.FRONT_TEST_CONTACT_ID || 'cnt_test';

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof CreateContactNote, 'object');
            assert.strictEqual(typeof CreateContactNote.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing contact ID', async function() {
            context.messages.in = {
                content: {
                    body: 'Test note without contact ID'
                }
            };

            try {
                await CreateContactNote.receive(context);
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
                    body: 'Test note with empty contact ID'
                }
            };

            try {
                await CreateContactNote.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });

        it('should throw CancelError for missing body', async function() {
            context.messages.in = {
                content: {
                    contactId: testContactId
                }
            };

            try {
                await CreateContactNote.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Note body is required.');
            }
        });

        it('should throw CancelError for empty body', async function() {
            context.messages.in = {
                content: {
                    contactId: testContactId,
                    body: ''
                }
            };

            try {
                await CreateContactNote.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Note body is required.');
            }
        });
    });

    describe('API Integration', function() {
        let createdContactId;

        beforeEach(async function() {
            // Create a test contact for each test to ensure we have a valid contact
            const CreateContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/CreateContact/CreateContact.js'));

            const testName = `Test Contact for Notes ${Date.now()}`;
            const createContext = createTestContext(process.env.FRONT_API_TOKEN);
            createContext.messages.in = {
                content: {
                    name: testName
                }
            };

            createContext.sendJson = (data, port) => {
                if (port === 'out') {
                    createdContactId = data.id;
                }
                return Promise.resolve();
            };

            await CreateContact.receive(createContext);

            if (!createdContactId) {
                throw new Error('Could not create test contact');
            }
        });

        afterEach(async function() {
            // Clean up - delete the test contact
            if (createdContactId) {
                try {
                    const DeleteContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/DeleteContact/DeleteContact.js'));
                    const deleteContext = createTestContext(process.env.FRONT_API_TOKEN);
                    deleteContext.messages.in = { content: { id: createdContactId } };
                    deleteContext.sendJson = () => Promise.resolve();
                    await DeleteContact.receive(deleteContext);
                } catch (error) {
                    // Ignore cleanup errors
                }
                createdContactId = null;
            }
        });

        it('should create a contact note with minimal data', async function() {
            const noteBody = `Test note created at ${new Date().toISOString()}`;

            context.messages.in = {
                content: {
                    contactId: createdContactId,
                    body: noteBody
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateContactNote.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.body, noteBody);
            assert.strictEqual(typeof outputs[0].data.created_at, 'number');
            assert.strictEqual(typeof outputs[0].data.updated_at, 'number');
        });

        it('should create a contact note with author ID', async function() {
            const noteBody = `Test note with author ${new Date().toISOString()}`;
            const authorId = process.env.FRONT_TEST_AUTHOR_ID || 'tea_test';

            context.messages.in = {
                content: {
                    contactId: createdContactId,
                    body: noteBody,
                    author_id: authorId
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateContactNote.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.body, noteBody);

            // Note: Author validation depends on the API - if invalid author_id is provided,
            // the API might ignore it or use the authenticated user's ID
            if (outputs[0].data.author) {
                assert.strictEqual(typeof outputs[0].data.author, 'object');
            }
        });

        it('should handle long note body', async function() {
            const longBody = 'This is a very long note body. '.repeat(50) + `Created at ${new Date().toISOString()}`;

            context.messages.in = {
                content: {
                    contactId: createdContactId,
                    body: longBody
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateContactNote.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.body, longBody);
        });

        it('should handle special characters in note body', async function() {
            const specialBody = `Special chars: àáâãäå ñ ç 日本語 ¡¿ @#$%^&*() ${new Date().toISOString()}`;

            context.messages.in = {
                content: {
                    contactId: createdContactId,
                    body: specialBody
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateContactNote.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.body, specialBody);
        });

        it('should handle non-existent contact ID', async function() {
            const nonExistentId = 'cnt_nonexistent123';
            const noteBody = 'Note for non-existent contact';

            context.messages.in = {
                content: {
                    contactId: nonExistentId,
                    body: noteBody
                }
            };

            try {
                await CreateContactNote.receive(context);
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
                    body: 'Test note'
                }
            };

            try {
                await CreateContactNote.receive(invalidContext);
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
                    body: 'Test note'
                }
            };

            try {
                await CreateContactNote.receive(context);
                assert.fail('Should have thrown an error for malformed ID');
            } catch (error) {
                // Should throw an HTTP error
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle invalid author ID gracefully', async function() {
            // This test will depend on the actual API behavior
            // Some APIs ignore invalid author IDs, others might error
            const invalidAuthorId = 'tea_invalid123';

            context.messages.in = {
                content: {
                    contactId: testContactId.startsWith('cnt_') ? testContactId : 'cnt_test',
                    body: 'Test note with invalid author',
                    author_id: invalidAuthorId
                }
            };

            try {
                // Mock sendJson to capture the output
                const outputs = [];
                context.sendJson = (data, port) => {
                    outputs.push({ data, port });
                    return Promise.resolve();
                };

                await CreateContactNote.receive(context);

                // If it succeeds, API likely ignored the invalid author_id
                assert.strictEqual(outputs.length, 1);
                assert.strictEqual(outputs[0].port, 'out');
            } catch (error) {
                // Or it might throw an API error
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
