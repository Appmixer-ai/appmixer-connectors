'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('FindMessages Component', function() {

    let context;
    let FindMessages;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_CHAT_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_CHAT_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindMessages = require(path.join(__dirname, '../../src/appmixer/googleChat/core/FindMessages/FindMessages.js'));
    });

    beforeEach(() => {
        // Load the lib
        const lib = require(path.join(__dirname, '../../src/appmixer/googleChat/lib.generated.js'));

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
            sendJson: (data, port) => ({ messages: { [port]: { content: data, options: data } } }),
            CancelError: class extends Error { constructor(message) { super(message); this.name = 'CancelError'; } }
        };

        // Add lib functions to the module context
        Object.assign(FindMessages, { lib });
    });

    it('should return output port schema when generateOutputPortOptions is true', async () => {
        context.properties.generateOutputPortOptions = true;
        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            outputType: 'array'
        };

        const result = await FindMessages.receive(context);

        assert(result, 'Result should exist');
        assert(result.messages, 'Result should have messages');
        assert(result.messages.out, 'Result should have out port');
        assert(result.messages.out.options, 'Result should have options for output port');
        assert(Array.isArray(result.messages.out.options), 'Options should be an array');

        console.log('Output port options generated successfully:', result.messages.out.options.length, 'options');
    });

    it('should throw error when space is missing', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindMessages.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Space is required'), 'Should throw space required error');
            console.log('Correctly validated missing space parameter');
        }
    });

    it('should list messages from a space successfully', async () => {
        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            outputType: 'array'
        };

        // The lib.sendArrayOutput function calls context.sendJson but doesn't return it
        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`Messages sent to port: ${port}`);
        };

        await FindMessages.receive(context);

        // Check if data was sent
        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(sentData.result, 'Result should exist in sent data');
            assert(Array.isArray(sentData.result), 'Result should be an array');
            console.log(`Found ${sentData.result.length} messages`);

            if (sentData.result.length > 0) {
                const message = sentData.result[0];
                assert(typeof message.name === 'string', 'Message name should be a string');
                assert(typeof message.createTime === 'string', 'Create time should be a string');
                console.log('First message:', message.name, message.createTime);
            }
        } else if (sentPort === 'notFound') {
            console.log('No messages found in space');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });

    it('should filter messages by date when filter is provided', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const filterDate = yesterday.toISOString();

        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            filter: `createTime > "${filterDate}"`,
            outputType: 'array'
        };

        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`Messages sent to port: ${port} with filter`);
        };

        await FindMessages.receive(context);

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(sentData.result, 'Result should exist in sent data');
            assert(Array.isArray(sentData.result), 'Result should be an array');
            console.log(`Found ${sentData.result.length} messages created after ${filterDate}`);
        } else if (sentPort === 'notFound') {
            console.log('No messages found with the applied filter');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });

    it('should filter messages by thread when thread filter is provided', async () => {
        if (!process.env.GOOGLE_CHAT_THREAD_NAME) {
            console.log('Skipping thread filter test - GOOGLE_CHAT_THREAD_NAME not provided');
            return;
        }

        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            filter: `thread.name = "${process.env.GOOGLE_CHAT_THREAD_NAME}"`,
            outputType: 'array'
        };

        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`Messages sent to port: ${port} with thread filter`);
        };

        await FindMessages.receive(context);

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(sentData.result, 'Result should exist in sent data');
            assert(Array.isArray(sentData.result), 'Result should be an array');
            console.log(`Found ${sentData.result.length} messages in thread ${process.env.GOOGLE_CHAT_THREAD_NAME}`);

            // Verify all messages are from the correct thread
            sentData.result.forEach(message => {
                if (message.thread && message.thread.name) {
                    assert(message.thread.name === process.env.GOOGLE_CHAT_THREAD_NAME,
                        `Expected thread ${process.env.GOOGLE_CHAT_THREAD_NAME}, got ${message.thread.name}`);
                }
            });
        } else if (sentPort === 'notFound') {
            console.log('No messages found in the specified thread');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });

    it('should return first item only when outputType is first', async () => {
        context.messages.in.content = {
            space: process.env.GOOGLE_CHAT_SPACE_ID,
            outputType: 'first'
        };

        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`First message sent to port: ${port}`);
        };

        await FindMessages.receive(context);

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(typeof sentData === 'object', 'Message should be an object');
            assert(typeof sentData.name === 'string', 'Message name should be a string');
            console.log('First message:', sentData.name);
        } else if (sentPort === 'notFound') {
            console.log('No messages found');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });
});
