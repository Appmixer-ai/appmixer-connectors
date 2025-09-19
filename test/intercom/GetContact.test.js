const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetContact Component', function() {
    let context;
    let GetContact;
    let testContactId;

    this.timeout(30000);

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetContact = require(path.join(__dirname, '../../src/appmixer/intercom/core/GetContact/GetContact.js'));

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

        // Create a test contact first
        try {
            const CreateContact = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateContact/CreateContact.js'));

            const createContext = { ...context };
            createContext.messages = {
                in: {
                    content: {
                        email: `test-get-contact-${Date.now()}@example.com`,
                        name: 'Test Contact for Get'
                    }
                }
            };

            const result = await CreateContact.receive(createContext);
            testContactId = result.data.id;
        } catch (error) {
            console.error('Error creating test contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should retrieve a contact by id', async function() {
        context.messages.in.content = {
            id: testContactId
        };

        try {
            const result = await GetContact.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return contact data');
            assert(result.data.id === testContactId, 'Should return correct contact');
        } catch (error) {
            console.error('Error retrieving contact:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {};

        try {
            await GetContact.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Contact ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent contact id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-contact-12345'
        };

        try {
            await GetContact.receive(context);
            assert.fail('Should have thrown an error for non-existent contact');
        } catch (error) {
            assert(error.response && error.response.status === 404, 'Should return 404 for non-existent contact');
        }
    });
});
