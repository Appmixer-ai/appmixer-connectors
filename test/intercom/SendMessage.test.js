const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('SendMessage Component', function() {
    let context;
    let SendMessage;
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
        SendMessage = require(path.join(__dirname, '../../src/appmixer/intercom/core/SendMessage/SendMessage.js'));
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
        const randomEmail = `test-message-${Date.now()}@example.com`;

        context.messages.in.content = {
            email: randomEmail,
            name: 'Test Message User'
        };

        try {
            const createResult = await CreateContact.receive(context);
            createdContactId = createResult.data.id;
        } catch (error) {
            console.error('Error creating test contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should send a message to a contact', async function() {
        const messageBody = `Test message sent at ${new Date().toISOString()}`;

        context.messages.in.content = {
            contact_id: createdContactId,
            body: messageBody
        };

        try {
            const result = await SendMessage.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return message data');
            assert(result.data.id, 'Should return message id');
            assert(result.data.body, 'Should return message body');
            assert(result.data.body.includes(messageBody), 'Should contain the sent message');
        } catch (error) {
            console.error('Error sending message:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should send a message with admin_id', async function() {
        const messageBody = `Test admin message sent at ${new Date().toISOString()}`;

        context.messages.in.content = {
            contact_id: createdContactId,
            body: messageBody,
            admin_id: '12345' // This may or may not exist, but shouldn't break the request
        };

        try {
            const result = await SendMessage.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return message data');
            assert(result.data.id, 'Should return message id');
        } catch (error) {
            console.error('Error sending message with admin_id:', error.response?.data || error.message);
            // This might fail due to invalid admin_id, which is expected
            if (error.response && error.response.status === 404) {
                console.log('Expected error for invalid admin_id');
            } else {
                throw error;
            }
        }
    });

    it('should throw error when contact_id is missing', async function() {
        context.messages.in.content = {
            body: 'Test message'
        };

        try {
            await SendMessage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Contact ID is required'), 'Should have appropriate error message');
        }
    });

    it('should throw error when body is missing', async function() {
        context.messages.in.content = {
            contact_id: createdContactId
        };

        try {
            await SendMessage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Message body is required'), 'Should have appropriate error message');
        }
    });
});
