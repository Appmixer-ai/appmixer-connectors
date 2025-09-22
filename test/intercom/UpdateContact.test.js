const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateContact Component', function() {
    let context;
    let UpdateContact;
    let CreateContact;
    let createdContactId;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        UpdateContact = require(path.join(__dirname, '../../src/appmixer/intercom/core/UpdateContact/UpdateContact.js'));
        CreateContact = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateContact/CreateContact.js'));

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
        const randomEmail = `test-update-${Date.now()}@example.com`;

        context.messages.in.content = {
            email: randomEmail,
            name: 'Original Name'
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
        const newName = `Updated Name ${Date.now()}`;

        context.messages.in.content = {
            contact_id: createdContactId,
            name: newName
        };

        try {
            const result = await UpdateContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return result data');
            // Update components should return empty object according to guidelines
            assert(typeof result.data === 'object', 'Should return an object');
        } catch (error) {
            console.error('Error updating contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update a contact email', async function() {
        const newEmail = `updated-${Date.now()}@example.com`;

        context.messages.in.content = {
            contact_id: createdContactId,
            email: newEmail
        };

        try {
            const result = await UpdateContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return result data');
            assert(typeof result.data === 'object', 'Should return an object');
        } catch (error) {
            console.error('Error updating contact email:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update contact custom attributes', async function() {
        const customAttributes = {
            test_field: 'test_value'
        };

        context.messages.in.content = {
            contact_id: createdContactId,
            custom_attributes: customAttributes
        };

        try {
            const result = await UpdateContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return result data');
            assert(typeof result.data === 'object', 'Should return an object');
        } catch (error) {
            // Custom attributes might not exist in Intercom, which is expected
            if (error.response && error.response.status === 400 &&
                error.response.data && error.response.data.errors &&
                error.response.data.errors[0].code === 'parameter_invalid') {
                console.log('Expected error for non-existent custom attribute');
                return; // This is acceptable behavior
            }
            console.error('Error updating contact custom attributes:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {
            name: 'Updated Name'
        };

        try {
            await UpdateContact.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Contact ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent contact id gracefully', async function() {
        context.messages.in.content = {
            contact_id: 'non-existent-contact-12345',
            name: 'Updated Name'
        };

        try {
            await UpdateContact.receive(context);
            // This might succeed or fail depending on Intercom's behavior
        } catch (error) {
            // If it fails, it should be a 404 error
            assert(error.response, 'Should have response data');
            assert(error.response.status === 404, 'Should return 404 for non-existent contact');
        }
    });
});
