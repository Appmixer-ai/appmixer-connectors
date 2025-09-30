'use strict';

const assert = require('assert');
const { checkAccessTokenOrSkip } = require('./testHelper');

describe('CreateConversation', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/CreateConversation/CreateConversation.js';
    let component;

    before(function() {
        // Skip all tests if no access token is available
        checkAccessTokenOrSkip(this);
        component = require(componentPath);
    });

    it('should create a new conversation', async () => {

        // First get a mailbox ID
        const mailboxResponse = await require('./httpRequest.js')({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/mailboxes',
            headers: {
                'Authorization': `Bearer ${process.env.HELPSCOUT_ACCESS_TOKEN}`
            }
        });

        const mailboxes = mailboxResponse.data['_embedded']?.mailboxes || [];
        if (mailboxes.length === 0) {
            console.log('No mailboxes found, skipping test');
            return;
        }

        const mailboxId = mailboxes[0].id;

        // Mock context
        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        mailboxId: mailboxId,
                        subject: 'Test Conversation from Automated Test',
                        customerEmail: 'test@example.com',
                        customerFirstName: 'Test',
                        customerLastName: 'Customer',
                        threadText: 'This is a test conversation created by automated testing.'
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                // HelpScout CREATE operations return 201 with empty body
                console.log('CreateConversation response:', JSON.stringify(data, null, 2));
                console.log('Conversation created successfully');
                return data;
            },
            CancelError: class extends Error {}
        };

        // Execute component
        const result = await component.receive(context);
        // Result might be empty object if API returns 201 with Location header
        console.log('CreateConversation result:', result);
    });

    it('should throw error when subject is missing', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        mailboxId: 123,
                        threadText: 'Test text'
                        // Missing subject
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: () => {},
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for missing subject');
        } catch (error) {
            assert(error.message.includes('Subject is required'));
        }
    });

    it('should throw error when mailboxId is missing', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        subject: 'Test Subject',
                        threadText: 'Test text'
                        // Missing mailboxId
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: () => {},
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for missing mailboxId');
        } catch (error) {
            assert(error.message.includes('Mailbox ID is required'));
        }
    });
});
