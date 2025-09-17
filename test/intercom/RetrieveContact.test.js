const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('RetrieveContact Component', function() {
    let context;
    let RetrieveContact;
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
        RetrieveContact = require(path.join(__dirname, '../../src/appmixer/intercom/core/RetrieveContact/RetrieveContact.js'));
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
        const randomEmail = `test-retrieve-${Date.now()}@example.com`;

        context.messages.in.content = {
            email: randomEmail,
            name: 'Test Retrieve User'
        };

        try {
            const createResult = await CreateContact.receive(context);
            createdContactId = createResult.data.id;
        } catch (error) {
            console.error('Error creating test contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should retrieve a contact by id', async function() {
        context.messages.in.content = {
            id: createdContactId
        };

        try {
            const result = await RetrieveContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return contact data');
            assert(result.data.id, 'Should return contact id');
            assert.strictEqual(result.data.id, createdContactId, 'Should return correct contact id');
            assert(result.data.email, 'Should return contact email');
        } catch (error) {
            console.error('Error retrieving contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {};

        try {
            await RetrieveContact.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Contact ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent contact id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-id-12345'
        };

        try {
            await RetrieveContact.receive(context);
            // This might succeed or fail depending on Intercom's behavior
        } catch (error) {
            // If it fails, it should be a 404 error
            assert(error.response, 'Should have response data');
            assert(error.response.status === 404, 'Should return 404 for non-existent contact');
        }
    });
});
