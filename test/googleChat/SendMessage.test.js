'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('SendMessage Component', function() {

    let context;
    let SendMessage;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_CHAT_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_CHAT_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        SendMessage = require(path.join(__dirname, '../../src/appmixer/googleChat/core/SendMessage/SendMessage.js'));
    });

    beforeEach(() => {
        // Mock context
        context = {
            auth: {
                accessToken: process.env.GOOGLE_CHAT_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: require('axios'),
            log: async (data) => console.log('LOG:', JSON.stringify(data, null, 2)),
            sendJson: (data, port) => ({ messages: { [port]: { content: data } } }),
            CancelError: class extends Error { constructor(message) { super(message); this.name = 'CancelError'; } }
        };
    });

    it('should throw error when space is missing', async () => {
        context.messages.in.content = {
            text: 'Test message'
        };

        try {
            await SendMessage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Space is required'), 'Should throw space required error');
            console.log('Correctly validated missing space parameter');
        }
    });

    it('should throw error when text is missing', async () => {
        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID
        };

        try {
            await SendMessage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Text is required'), 'Should throw text required error');
            console.log('Correctly validated missing text parameter');
        }
    });

    it('should send a message successfully', async () => {
        const testMessage = `Test message from Appmixer connector - ${new Date().toISOString()}`;

        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            text: testMessage
        };

        const result = await SendMessage.receive(context);

        assert(result, 'Result should exist');
        assert(result.messages, 'Result should have messages');
        assert(result.messages.out, 'Result should have out port');

        const sentMessage = result.messages.out.content;
        assert(typeof sentMessage === 'object', 'Sent message should be an object');
        assert(typeof sentMessage.name === 'string', 'Message name should be a string');
        assert(typeof sentMessage.createTime === 'string', 'Create time should be a string');
        assert(sentMessage.text === testMessage, 'Message text should match what was sent');

        console.log('Message sent successfully:', sentMessage.name);
        console.log('Message text:', sentMessage.text);
        console.log('Created at:', sentMessage.createTime);
    });

    it('should send a message with special characters', async () => {
        const testMessage = `Special chars test: 🚀 @mention #hashtag *bold* _italic_ \`code\` - ${new Date().toISOString()}`;

        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            text: testMessage
        };

        const result = await SendMessage.receive(context);

        assert(result, 'Result should exist');
        assert(result.messages, 'Result should have messages');
        assert(result.messages.out, 'Result should have out port');

        const sentMessage = result.messages.out.content;
        assert(typeof sentMessage === 'object', 'Sent message should be an object');
        assert(sentMessage.text === testMessage, 'Message text should match what was sent');

        console.log('Message with special characters sent successfully:', sentMessage.name);
    });

    it('should send a long message', async () => {
        const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
        const testMessage = `Long message test: ${longText} - ${new Date().toISOString()}`;

        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            text: testMessage
        };

        const result = await SendMessage.receive(context);

        assert(result, 'Result should exist');
        assert(result.messages, 'Result should have messages');
        assert(result.messages.out, 'Result should have out port');

        const sentMessage = result.messages.out.content;
        assert(typeof sentMessage === 'object', 'Sent message should be an object');
        assert(sentMessage.text === testMessage, 'Message text should match what was sent');

        console.log('Long message sent successfully:', sentMessage.name);
        console.log('Message length:', sentMessage.text.length, 'characters');
    });
});
