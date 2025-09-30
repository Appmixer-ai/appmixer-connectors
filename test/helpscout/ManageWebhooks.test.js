const assert = require('assert');
const crypto = require('crypto');
const { checkAccessTokenOrSkip } = require('./testHelper');

const component = require('../../src/appmixer/helpscout/core/ManageWebhooks/ManageWebhooks.js');
const httpRequest = require('./httpRequest.js');

describe('ManageWebhooks', () => {

    before(function() {
        checkAccessTokenOrSkip(this);
    });

    it('should create a webhook', async () => {
        const webhookUrl = `https://example.com/webhook/${crypto.randomBytes(8).toString('hex')}`;
        const events = ['convo.created', 'convo.status'];
        const secret = 'test-secret';

        const context = {
            messages: {
                in: {
                    content: {
                        url: webhookUrl,
                        events: events,
                        secret: secret
                    }
                }
            },
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            httpRequest: httpRequest,
            sendJson: (data, port) => {
                console.log('ManageWebhooks result:', data);
                return data;
            },
            CancelError: class extends Error {}
        };

        await component.receive(context);
        console.log('Webhook created successfully');
    });

    it('should throw error when url is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        events: ['convo.created']
                    }
                }
            },
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            httpRequest: httpRequest,
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Expected error for missing url');
        } catch (error) {
            assert(error.message.includes('Webhook URL is required'),
                `Expected 'Webhook URL is required' error, got: ${error.message}`);
        }
    });

    it('should throw error when events is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        url: 'https://example.com/webhook'
                    }
                }
            },
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            httpRequest: httpRequest,
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Expected error for missing events');
        } catch (error) {
            assert(error.message.includes('Events array is required'),
                `Expected 'Events array is required' error, got: ${error.message}`);
        }
    });
});
