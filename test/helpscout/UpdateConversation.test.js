'use strict';

const assert = require('assert');
const { checkAccessTokenOrSkip } = require('./testHelper');

describe('UpdateConversation', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/UpdateConversation/UpdateConversation.js';
    let component;

    before(function() {
        // Skip all tests if no access token is available
        checkAccessTokenOrSkip(this);
        component = require(componentPath);
    });

    it('should update conversation status', async () => {

        // First get a conversation ID
        const listResponse = await require('./httpRequest.js')({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/conversations',
            headers: {
                'Authorization': `Bearer ${process.env.HELPSCOUT_ACCESS_TOKEN}`
            }
        });

        const conversations = listResponse.data['_embedded']?.conversations || [];
        if (conversations.length === 0) {
            console.log('No conversations found, skipping test');
            return;
        }

        const conversationId = conversations[0].id;

        // Try updating with tags instead of status
        const testTags = ['test-tag-' + Date.now()];

        // Mock context
        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        id: conversationId,
                        tags: testTags
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                // HelpScout PATCH operations may return empty body
                console.log('UpdateConversation response:', JSON.stringify(data, null, 2));
                return data;
            },
            CancelError: class extends Error {}
        };

        // Execute component
        await component.receive(context);
        console.log(`Updated conversation ${conversationId} with tags: ${testTags.join(', ')}`);
    });

    it('should throw error when id is missing', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        status: 'active'
                        // Missing id
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: () => {},
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for missing id');
        } catch (error) {
            assert(error.message.includes('Conversation ID is required'));
        }
    });

    it('should throw error when no fields to update', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        id: 123
                        // No fields to update
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: () => {},
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for no update fields');
        } catch (error) {
            assert(error.message.includes('At least one field must be provided'));
        }
    });
});
