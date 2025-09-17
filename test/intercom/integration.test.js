const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createMockContext } = require('../utils');
const httpRequest = require('./httpRequest');

// Make createMockContext available globally
global.createMockContext = createMockContext;

describe('Intercom Connector Integration Tests', () => {

    let context;

    beforeEach(() => {
        context = global.createMockContext({
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            httpRequest: httpRequest
        });
    });

    describe('Contacts', () => {
        const FindContacts = require('../../src/appmixer/intercom/core/FindContacts/FindContacts');
        const CreateContact = require('../../src/appmixer/intercom/core/CreateContact/CreateContact');
        const RetrieveContact = require('../../src/appmixer/intercom/core/RetrieveContact/RetrieveContact');

        it('should create and retrieve a contact', async () => {
            const randomEmail = `integration-test-${Date.now()}@example.com`;
            
            // 1. Create a contact
            context.messages = {
                in: {
                    content: {
                        email: randomEmail,
                        name: 'Integration Test User'
                    }
                }
            };

            await CreateContact.receive(context);
            assert(context.sendJson.calledOnce, 'CreateContact should send data');
            const createdContact = context.sendJson.firstCall.args[0];
            assert(createdContact.id, 'Should return contact id');
            assert.strictEqual(createdContact.email, randomEmail, 'Should return correct email');

            // Reset context for next call
            context.sendJson.resetHistory();

            // 2. Retrieve the contact
            context.messages = {
                in: {
                    content: {
                        id: createdContact.id
                    }
                }
            };

            await RetrieveContact.receive(context);
            assert(context.sendJson.calledOnce, 'RetrieveContact should send data');
            const retrievedContact = context.sendJson.firstCall.args[0];
            assert.strictEqual(retrievedContact.id, createdContact.id, 'Should retrieve same contact');
            assert.strictEqual(retrievedContact.email, randomEmail, 'Should have correct email');

            // Reset context for next call
            context.sendJson.resetHistory();

            // 3. List contacts (should include our new contact)
            context.messages = {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            };

            await FindContacts.receive(context);
            assert(context.sendJson.calledOnce, 'FindContacts should send data');
            const contacts = context.sendJson.firstCall.args[0];
            assert(Array.isArray(contacts.result), 'Should return array of contacts');
            assert(contacts.result.length > 0, 'Should have at least one contact');
        });
    });

    describe('Companies', () => {
        const FindCompanies = require('../../src/appmixer/intercom/core/FindCompanies/FindCompanies');

        it('should list companies', async () => {
            context.messages = {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            };

            await FindCompanies.receive(context);

            assert(context.sendJson.calledOnce, 'FindCompanies should send data');
            const companies = context.sendJson.firstCall.args[0];
            assert(companies.result, 'Should return result');
            assert(Array.isArray(companies.result), 'result should be an array');
            assert(typeof companies.count === 'number', 'Should return count');
        });
    });
});