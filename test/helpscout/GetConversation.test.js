'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('GetConversation', function() {
    this.timeout(30000); // 30 second timeout

    const componentPath = '../../src/appmixer/helpscout/core/GetConversation/GetConversation.js';
    let component;

    before(() => {
        component = require(componentPath);
    });

    it('should get conversation by id', async () => {

        // First get a conversation ID by listing conversations
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
                        id: conversationId
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert(typeof data === 'object');
                assert(typeof data.id === 'number');
                assert(typeof data.subject === 'string');
                console.log(`Conversation: ${data.id} - ${data.subject}`);
                return data;
            }
        };

        // Execute component
        const result = await component.receive(context);
        assert(result);
    });

    it('should throw error for non-existent conversation', async () => {

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {
                        id: 99999999999 // Non-existent ID
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                // Should not reach here
                assert.fail('Should have thrown an error');
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should have thrown an error for non-existent conversation');
        } catch (error) {
            console.log(`Expected error for non-existent conversation: ${error.message}`);
            assert(error.message.includes('404') || error.message.includes('not found'));
        }
    });
});
