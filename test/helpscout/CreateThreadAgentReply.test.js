'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CreateThreadAgentReply', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/CreateThreadAgentReply/CreateThreadAgentReply.js';
    let component;

    before(() => {
        component = require(componentPath);
    });

    it('should create a thread agent reply', async () => {

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

        // Mock context
        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        id: conversationId,
                        text: 'This is an automated test reply from the agent.'
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                console.log('CreateThreadAgentReply response:', JSON.stringify(data, null, 2));
                return data;
            },
            CancelError: class extends Error {}
        };

        // Execute component
        await component.receive(context);
        console.log(`Created agent reply in conversation ${conversationId}`);
    });

    it('should throw error when conversation id is missing', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        text: 'Reply text'
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
            assert.fail('Should have thrown an error for missing conversation ID');
        } catch (error) {
            assert(error.message.includes('Conversation ID is required'));
        }
    });

    it('should throw error when text is missing', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        id: 123
                        // Missing text
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: () => {},
            CancelError: class extends Error {}
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for missing text');
        } catch (error) {
            assert(error.message.includes('Reply text is required'));
        }
    });
});
