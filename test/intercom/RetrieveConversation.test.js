const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('RetrieveConversation Component', function() {
    let context;
    let RetrieveConversation;
    let CreateConversation;
    let CreateContact;
    let createdConversationId;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        RetrieveConversation = require(path.join(__dirname, '../../src/appmixer/intercom/core/RetrieveConversation/RetrieveConversation.js'));
        CreateConversation = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateConversation/CreateConversation.js'));
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
        // Create a test contact and conversation before each test
        const randomEmail = `test-conversation-${Date.now()}@example.com`;

        // First create a contact
        context.messages.in.content = {
            email: randomEmail,
            name: 'Test Conversation User'
        };

        let contactId;
        try {
            const createContactResult = await CreateContact.receive(context);
            contactId = createContactResult.data.id;
        } catch (error) {
            console.error('Error creating test contact:', error.response?.data || error.message);
            throw error;
        }

        // Then create a conversation
        context.messages.in.content = {
            contact_id: contactId,
            body: 'Test conversation message for retrieve'
        };

        try {
            const createConversationResult = await CreateConversation.receive(context);
            createdConversationId = createConversationResult.data.id;
        } catch (error) {
            console.error('Error creating test conversation:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should retrieve a conversation by id', async function() {
        context.messages.in.content = {
            id: createdConversationId
        };

        try {
            const result = await RetrieveConversation.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return conversation data');
            assert(result.data.id, 'Should return conversation id');
            assert.strictEqual(result.data.id, createdConversationId, 'Should return correct conversation id');
        } catch (error) {
            console.error('Error retrieving conversation:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {};

        try {
            await RetrieveConversation.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Conversation ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent conversation id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-conversation-id-12345'
        };

        try {
            await RetrieveConversation.receive(context);
            // This might succeed or fail depending on Intercom's behavior
        } catch (error) {
            // If it fails, it should be a 404 error
            assert(error.response, 'Should have response data');
            assert(error.response.status === 404, 'Should return 404 for non-existent conversation');
        }
    });
});
