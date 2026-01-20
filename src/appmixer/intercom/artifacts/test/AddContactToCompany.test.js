const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../../test/.env') });
const assert = require('assert');

describe('AddContactToCompany Component', function() {
    let context;
    let AddContactToCompany;
    let CreateContact;
    let CreateUpdateCompany;
    let createdContactId;
    let createdCompanyId;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        AddContactToCompany = require('../../core/AddContactToCompany/AddContactToCompany.js');
        CreateContact = require('../../core/CreateContact/CreateContact.js');
        CreateUpdateCompany = require('../../core/CreateUpdateCompany/CreateUpdateCompany.js');

        // Mock context
        context = {
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            sendJson: function(data, port) {
                return { data, port };
            },
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    beforeEach(async function() {
        // Create a test contact
        const randomEmail = `test-add-company-${Date.now()}@example.com`;

        context.messages.in.content = {
            email: randomEmail,
            name: 'Test Add Company User'
        };

        try {
            const createContactResult = await CreateContact.receive(context);
            createdContactId = createContactResult.data.id;
        } catch (error) {
            console.error('Error creating test contact:', error.response?.data || error.message);
            throw error;
        }

        // Create a test company
        const randomCompanyId = `test-company-${Date.now()}`;

        context.messages.in.content = {
            company_id: randomCompanyId,
            name: 'Test Company for Add Contact'
        };

        try {
            const createCompanyResult = await CreateUpdateCompany.receive(context);
            createdCompanyId = createCompanyResult.data.id;
        } catch (error) {
            console.error('Error creating test company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should add a contact to a company', async function() {
        context.messages.in.content = {
            contact_id: createdContactId,
            company_id: createdCompanyId
        };

        try {
            const result = await AddContactToCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.id === createdCompanyId, 'Should return correct company id');
        } catch (error) {
            console.error('Error adding contact to company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when contact_id is missing', async function() {
        context.messages.in.content = {
            company_id: createdCompanyId
        };

        try {
            await AddContactToCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Contact ID is required'), 'Should have appropriate error message');
        }
    });

    it('should throw error when company_id is missing', async function() {
        context.messages.in.content = {
            contact_id: createdContactId
        };

        try {
            await AddContactToCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Company ID is required'), 'Should have appropriate error message');
        }
    });
});
