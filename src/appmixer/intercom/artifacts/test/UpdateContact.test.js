const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../../test/.env') });
const assert = require('assert');

describe('UpdateContact Component', function() {
    let context;
    let UpdateContact;
    let CreateContact;
    let createdContactId;
    let createdEmail;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        UpdateContact = require('../../core/UpdateContact/UpdateContact.js');
        CreateContact = require('../../core/CreateContact/CreateContact.js');

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
        // Create a test contact before each test
        createdEmail = `test-update-${Date.now()}@example.com`;

        context.messages.in.content = {
            email: createdEmail,
            name: 'Test Update User'
        };

        try {
            const createResult = await CreateContact.receive(context);
            createdContactId = createResult.data.id;
        } catch (error) {
            console.error('Error creating test contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update a contact name', async function() {
        const newName = 'Updated Name ' + Date.now();

        context.messages.in.content = {
            id: createdContactId,
            name: newName
        };

        try {
            const result = await UpdateContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return contact data');
            assert(result.data.id === createdContactId, 'Should return correct contact id');
            assert(result.data.name === newName, 'Should have updated name');
        } catch (error) {
            console.error('Error updating contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update a contact email', async function() {
        const newEmail = `updated-${Date.now()}@example.com`;

        context.messages.in.content = {
            id: createdContactId,
            email: newEmail
        };

        try {
            const result = await UpdateContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return contact data');
            assert(result.data.id === createdContactId, 'Should return correct contact id');
            assert(result.data.email === newEmail, 'Should have updated email');
        } catch (error) {
            console.error('Error updating contact email:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update multiple contact fields', async function() {
        const newName = 'Multi Update ' + Date.now();
        const newPhone = '+1234567890';

        context.messages.in.content = {
            id: createdContactId,
            name: newName,
            phone: newPhone
        };

        try {
            const result = await UpdateContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return contact data');
            assert(result.data.id === createdContactId, 'Should return correct contact id');
            assert(result.data.name === newName, 'Should have updated name');
            assert(result.data.phone === newPhone, 'Should have updated phone');
        } catch (error) {
            console.error('Error updating multiple fields:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {
            name: 'Test Name'
        };

        try {
            await UpdateContact.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent contact id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-contact-12345',
            name: 'Test Name'
        };

        try {
            await UpdateContact.receive(context);
            assert.fail('Should have thrown an error for non-existent contact');
        } catch (error) {
            assert(error.response, 'Should have response data');
            assert(error.response.status === 404, 'Should return 404 for non-existent contact');
        }
    });
});
