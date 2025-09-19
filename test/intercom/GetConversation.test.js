const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetConversation Component', function() {
    let context;
    let GetConversation;
    let testConversationId;

    this.timeout(30000);

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetConversation = require(path.join(__dirname, '../../src/appmixer/intercom/core/GetConversation/GetConversation.js'));

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
            log: function(level, message, data) {
                if (level === 'error') {
                    console.error(`[${level}] ${message}`, data || '');
                }
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        // Create a test conversation first
        try {
            const CreateContact = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateContact/CreateContact.js'));
            const CreateConversation = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateConversation/CreateConversation.js'));

            // Create a contact first
            const createContactContext = { ...context };
            createContactContext.messages = {
                in: {
                    content: {
                        email: `test-get-conversation-${Date.now()}@example.com`,
                        name: 'Test Contact for Conversation'
                    }
                }
            };

            const contactResult = await CreateContact.receive(createContactContext);
            const contactId = contactResult.data.id;

            // Create a conversation
            const createConversationContext = { ...context };
            createConversationContext.messages = {
                in: {
                    content: {
                        contact_id: contactId,
                        body: 'Test conversation for GetConversation test'
                    }
                }
            };

            const conversationResult = await CreateConversation.receive(createConversationContext);
            testConversationId = conversationResult.data.id;
        } catch (error) {
            console.error('Error creating test conversation:', error.response?.data || error.message);
            // Don't throw error here, let the tests handle missing conversation
        }
    });

    it('should retrieve a conversation by id', async function() {
        if (!testConversationId) {
            console.log('Skipping test - no test conversation available');
            this.skip();
        }

        context.messages.in.content = {
            id: testConversationId
        };

        try {
            const result = await GetConversation.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return conversation data');
            assert(result.data.id === testConversationId, 'Should return correct conversation');
        } catch (error) {
            console.error('Error retrieving conversation:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {};

        try {
            await GetConversation.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Conversation ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent conversation id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-conversation-12345'
        };

        try {
            await GetConversation.receive(context);
            assert.fail('Should have thrown an error for non-existent conversation');
        } catch (error) {
            assert(error.response && error.response.status === 404, 'Should return 404 for non-existent conversation');
        }
    });
});
