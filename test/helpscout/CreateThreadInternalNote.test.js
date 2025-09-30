const assert = require('assert');
const crypto = require('crypto');
const { checkAccessTokenOrSkip } = require('./testHelper');

const component = require('../../src/appmixer/helpscout/core/CreateThreadInternalNote/CreateThreadInternalNote.js');
const httpRequest = require('./httpRequest.js');

describe('CreateThreadInternalNote', () => {

    before(function() {
        checkAccessTokenOrSkip(this);
    });

    it('should create an internal note on a conversation', async () => {
        // Use a known conversation ID (from previous test runs)
        const conversationId = 3092600559;
        const noteText = `Internal note from automated test - ${crypto.randomBytes(8).toString('hex')}`;

        const context = {
            messages: {
                in: {
                    content: {
                        id: conversationId,
                        text: noteText
                    }
                }
            },
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            httpRequest: httpRequest,
            sendJson: (data, port) => {
                console.log('CreateThreadInternalNote result:', data);
                return data;
            },
            CancelError: class extends Error {}
        };

        await component.receive(context);
        // CreateThreadInternalNote may return empty data on success (201 status)
        console.log('Internal note created successfully');
    });

    it('should throw error when conversation id is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        text: 'Test internal note'
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
            assert.fail('Expected error for missing conversation id');
        } catch (error) {
            assert(error.message.includes('Conversation ID is required'),
                `Expected 'Conversation ID is required' error, got: ${error.message}`);
        }
    });

    it('should throw error when text is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        id: 123456
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
            assert.fail('Expected error for missing text');
        } catch (error) {
            assert(error.message.includes('Note text is required'),
                `Expected 'Note text is required' error, got: ${error.message}`);
        }
    });
});
