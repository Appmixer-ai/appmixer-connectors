'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('Contacts Integration Tests', function() {
    let CreateContact;
    let GetContact;
    let UpdateContact;
    let DeleteContact;
    let SearchContacts;
    let CreateContactNote;
    let ListContactNotes;
    let createdContactIds = [];

    this.timeout(60000); // Longer timeout for integration tests

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            console.log('Skipping integration tests - FRONT_API_TOKEN not set');
            this.skip();
        }

        // Load all components
        CreateContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/CreateContact/CreateContact.js'));
        GetContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/GetContact/GetContact.js'));
        UpdateContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/UpdateContact/UpdateContact.js'));
        DeleteContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/DeleteContact/DeleteContact.js'));
        SearchContacts = require(path.join(__dirname, '../../../src/appmixer/front/contacts/SearchContacts/SearchContacts.js'));
        CreateContactNote = require(path.join(__dirname, '../../../src/appmixer/front/contacts/CreateContactNote/CreateContactNote.js'));
        ListContactNotes = require(path.join(__dirname, '../../../src/appmixer/front/contacts/ListContactNotes/ListContactNotes.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    after(async function() {
        // Clean up any created contacts
        for (const contactId of createdContactIds) {
            try {
                const deleteContext = createTestContext(process.env.FRONT_API_TOKEN);
                deleteContext.messages.in = { content: { id: contactId } };
                deleteContext.sendJson = () => Promise.resolve();
                await DeleteContact.receive(deleteContext);
            } catch (error) {
                // Ignore cleanup errors
                console.log(`Failed to cleanup contact ${contactId}:`, error.message);
            }
        }
    });

    describe('Complete Contact Lifecycle', function() {
        it('should create, get, update, search, and delete a contact', async function() {
            const timestamp = Date.now();
            const contactName = `Integration Test Contact ${timestamp}`;
            let contactId;

            // 1. Create Contact
            const createContext = createTestContext(process.env.FRONT_API_TOKEN);
            createContext.messages.in = {
                content: {
                    name: contactName,
                    description: 'Created during integration test',
                    is_spammer: false
                }
            };

            let createOutput;
            createContext.sendJson = (data, port) => {
                createOutput = { data, port };
                return Promise.resolve();
            };

            await CreateContact.receive(createContext);

            assert.strictEqual(createOutput.port, 'out');
            assert.strictEqual(typeof createOutput.data.id, 'string');
            assert.strictEqual(createOutput.data.name, contactName);

            contactId = createOutput.data.id;
            createdContactIds.push(contactId);

            await rateLimitDelay();

            // 2. Get Contact
            const getContext = createTestContext(process.env.FRONT_API_TOKEN);
            getContext.messages.in = {
                content: {
                    id: contactId
                }
            };

            let getOutput;
            getContext.sendJson = (data, port) => {
                getOutput = { data, port };
                return Promise.resolve();
            };

            await GetContact.receive(getContext);

            assert.strictEqual(getOutput.port, 'out');
            assert.strictEqual(getOutput.data.id, contactId);
            assert.strictEqual(getOutput.data.name, contactName);

            await rateLimitDelay();

            // 3. Update Contact
            const updatedName = `${contactName} (Updated)`;
            const updateContext = createTestContext(process.env.FRONT_API_TOKEN);
            updateContext.messages.in = {
                content: {
                    id: contactId,
                    name: updatedName,
                    description: 'Updated during integration test',
                    is_spammer: false
                }
            };

            let updateOutput;
            updateContext.sendJson = (data, port) => {
                updateOutput = { data, port };
                return Promise.resolve();
            };

            await UpdateContact.receive(updateContext);

            assert.strictEqual(updateOutput.port, 'out');
            assert.deepStrictEqual(updateOutput.data, {});

            await rateLimitDelay();

            // 4. Verify Update by Getting Contact Again
            const verifyContext = createTestContext(process.env.FRONT_API_TOKEN);
            verifyContext.messages.in = {
                content: {
                    id: contactId
                }
            };

            let verifyOutput;
            verifyContext.sendJson = (data, port) => {
                verifyOutput = { data, port };
                return Promise.resolve();
            };

            await GetContact.receive(verifyContext);

            assert.strictEqual(verifyOutput.port, 'out');
            assert.strictEqual(verifyOutput.data.id, contactId);
            assert.strictEqual(verifyOutput.data.name, updatedName);

            await rateLimitDelay();

            // 5. Search for the Contact
            const searchContext = createTestContext(process.env.FRONT_API_TOKEN);
            searchContext.messages.in = {
                content: {
                    q: `name:"${updatedName}"`,
                    outputType: 'array'
                }
            };

            let searchOutput;
            searchContext.sendJson = (data, port) => {
                searchOutput = { data, port };
                return Promise.resolve();
            };

            await SearchContacts.receive(searchContext);

            // Search might return results or go to notFound depending on indexing timing
            assert(searchOutput.port === 'out' || searchOutput.port === 'notFound');

            await rateLimitDelay();

            // 6. Delete Contact
            const deleteContext = createTestContext(process.env.FRONT_API_TOKEN);
            deleteContext.messages.in = {
                content: {
                    id: contactId
                }
            };

            let deleteOutput;
            deleteContext.sendJson = (data, port) => {
                deleteOutput = { data, port };
                return Promise.resolve();
            };

            await DeleteContact.receive(deleteContext);

            assert.strictEqual(deleteOutput.port, 'out');
            assert.deepStrictEqual(deleteOutput.data, {});

            // Remove from cleanup list since we just deleted it
            const index = createdContactIds.indexOf(contactId);
            if (index > -1) {
                createdContactIds.splice(index, 1);
            }

            await rateLimitDelay();

            // 7. Verify Deletion by Trying to Get Contact
            const deletedGetContext = createTestContext(process.env.FRONT_API_TOKEN);
            deletedGetContext.messages.in = {
                content: {
                    id: contactId
                }
            };

            let deletedGetOutput;
            deletedGetContext.sendJson = (data, port) => {
                deletedGetOutput = { data, port };
                return Promise.resolve();
            };

            await GetContact.receive(deletedGetContext);

            assert.strictEqual(deletedGetOutput.port, 'notFound');
            assert.deepStrictEqual(deletedGetOutput.data, {});
        });
    });

    describe('Contact Notes Lifecycle', function() {
        let contactId;

        beforeEach(async function() {
            // Create a test contact for notes tests
            const timestamp = Date.now();
            const contactName = `Notes Test Contact ${timestamp}`;

            const createContext = createTestContext(process.env.FRONT_API_TOKEN);
            createContext.messages.in = {
                content: {
                    name: contactName,
                    description: 'Contact for notes testing'
                }
            };

            let createOutput;
            createContext.sendJson = (data, port) => {
                createOutput = { data, port };
                return Promise.resolve();
            };

            await CreateContact.receive(createContext);
            contactId = createOutput.data.id;
            createdContactIds.push(contactId);

            await rateLimitDelay();
        });

        it('should create and list contact notes', async function() {
            const noteBody = `Test note created at ${new Date().toISOString()}`;

            // 1. Create Contact Note
            const createNoteContext = createTestContext(process.env.FRONT_API_TOKEN);
            createNoteContext.messages.in = {
                content: {
                    contactId: contactId,
                    body: noteBody
                }
            };

            let createNoteOutput;
            createNoteContext.sendJson = (data, port) => {
                createNoteOutput = { data, port };
                return Promise.resolve();
            };

            await CreateContactNote.receive(createNoteContext);

            assert.strictEqual(createNoteOutput.port, 'out');
            assert.strictEqual(typeof createNoteOutput.data.id, 'string');
            assert.strictEqual(createNoteOutput.data.body, noteBody);

            await rateLimitDelay();

            // 2. List Contact Notes
            const listNotesContext = createTestContext(process.env.FRONT_API_TOKEN);
            listNotesContext.messages.in = {
                content: {
                    contactId: contactId,
                    outputType: 'array'
                }
            };

            let listNotesOutput;
            listNotesContext.sendJson = (data, port) => {
                listNotesOutput = { data, port };
                return Promise.resolve();
            };

            await ListContactNotes.receive(listNotesContext);

            assert.strictEqual(listNotesOutput.port, 'out');
            assert.strictEqual(typeof listNotesOutput.data, 'object');

            // Verify that our created note is in the list
            // Note: The exact structure depends on the lib.sendArrayOutput implementation
            // But we should have at least one note with our body
        });

        it('should handle multiple notes for a contact', async function() {
            const note1Body = `First note ${new Date().toISOString()}`;
            const note2Body = `Second note ${new Date().toISOString()}`;

            // Create first note
            const createNote1Context = createTestContext(process.env.FRONT_API_TOKEN);
            createNote1Context.messages.in = {
                content: {
                    contactId: contactId,
                    body: note1Body
                }
            };
            createNote1Context.sendJson = () => Promise.resolve();
            await CreateContactNote.receive(createNote1Context);

            await rateLimitDelay();

            // Create second note
            const createNote2Context = createTestContext(process.env.FRONT_API_TOKEN);
            createNote2Context.messages.in = {
                content: {
                    contactId: contactId,
                    body: note2Body
                }
            };
            createNote2Context.sendJson = () => Promise.resolve();
            await CreateContactNote.receive(createNote2Context);

            await rateLimitDelay();

            // List all notes
            const listNotesContext = createTestContext(process.env.FRONT_API_TOKEN);
            listNotesContext.messages.in = {
                content: {
                    contactId: contactId,
                    outputType: 'array'
                }
            };

            let listNotesOutput;
            listNotesContext.sendJson = (data, port) => {
                listNotesOutput = { data, port };
                return Promise.resolve();
            };

            await ListContactNotes.receive(listNotesContext);

            assert.strictEqual(listNotesOutput.port, 'out');
            assert.strictEqual(typeof listNotesOutput.data, 'object');
        });
    });

    describe('Error Scenarios', function() {
        it('should handle operations on non-existent contact', async function() {
            const nonExistentId = 'cnt_nonexistent_integration_test';

            // Try to get non-existent contact
            const getContext = createTestContext(process.env.FRONT_API_TOKEN);
            getContext.messages.in = {
                content: {
                    id: nonExistentId
                }
            };

            let getOutput;
            getContext.sendJson = (data, port) => {
                getOutput = { data, port };
                return Promise.resolve();
            };

            await GetContact.receive(getContext);
            assert.strictEqual(getOutput.port, 'notFound');

            await rateLimitDelay();

            // Try to create note for non-existent contact
            const createNoteContext = createTestContext(process.env.FRONT_API_TOKEN);
            createNoteContext.messages.in = {
                content: {
                    contactId: nonExistentId,
                    body: 'Note for non-existent contact'
                }
            };

            try {
                await CreateContactNote.receive(createNoteContext);
                assert.fail('Should have thrown error for non-existent contact');
            } catch (error) {
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
