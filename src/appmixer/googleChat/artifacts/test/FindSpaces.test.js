'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('FindSpaces Component', function() {

    let context;
    let FindSpaces;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_CHAT_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_CHAT_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindSpaces = require(path.join(__dirname, '../../src/appmixer/googleChat/core/FindSpaces/FindSpaces.js'));
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
        Object.assign(FindSpaces, { lib });
    });

    it('should return output port schema when generateOutputPortOptions is true', async () => {
        context.properties.generateOutputPortOptions = true;
        context.messages.in.content = {
            outputType: 'array'
        };

        const result = await FindSpaces.receive(context);

        assert(result, 'Result should exist');
        assert(result.messages, 'Result should have messages');
        assert(result.messages.out, 'Result should have out port');
        assert(result.messages.out.options, 'Result should have options for output port');
        assert(Array.isArray(result.messages.out.options), 'Options should be an array');

        console.log('Output port options generated successfully:', result.messages.out.options.length, 'options');
    });

    it('should list spaces successfully', async () => {
        context.messages.in.content = {
            outputType: 'array'
        };

        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`Spaces sent to port: ${port}`);
        };

        await FindSpaces.receive(context);

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(sentData.result, 'Result should exist in sent data');
            assert(Array.isArray(sentData.result), 'Result should be an array');
            console.log(`Found ${sentData.result.length} spaces`);

            if (sentData.result.length > 0) {
                const space = sentData.result[0];
                assert(typeof space.name === 'string', 'Space name should be a string');
                assert(typeof space.spaceType === 'string', 'Space type should be a string');
                console.log('First space:', space.name, space.spaceType);
            }
        } else if (sentPort === 'notFound') {
            console.log('No spaces found');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });

    it('should filter spaces by type', async () => {
        context.messages.in.content = {
            spaceTypes: ['SPACE'],
            outputType: 'array'
        };

        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`Filtered spaces sent to port: ${port}`);
        };

        await FindSpaces.receive(context);

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(sentData.result, 'Result should exist in sent data');
            assert(Array.isArray(sentData.result), 'Result should be an array');
            console.log(`Found ${sentData.result.length} SPACE type spaces`);

            // Verify all returned spaces are of type SPACE
            sentData.result.forEach(space => {
                assert(space.spaceType === 'SPACE', `Expected SPACE type, got ${space.spaceType}`);
            });
        } else if (sentPort === 'notFound') {
            console.log('No SPACE type spaces found');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });

    it('should return first item only when outputType is first', async () => {
        context.messages.in.content = {
            outputType: 'first'
        };

        let sentData;
        let sentPort;

        // Capture output from context.sendJson
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            await context.log({ step: 'output-captured', data, port });
        };

        await FindSpaces.receive(context);

        assert(sentData, 'Result should exist');

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(typeof sentData === 'object', 'Space should be an object');
            assert(typeof sentData.name === 'string', 'Space name should be a string');
            assert(sentData.name.startsWith('spaces/'), 'Space name should start with spaces/');
            assert(typeof sentData.count === 'number', 'Should include count metadata');
            assert(typeof sentData.index === 'number', 'Should include index metadata');
            assert(sentData.index === 0, 'First item should have index 0');
            console.log('First space sent to port: out');
            console.log(`First space: ${sentData.name}`);
        } else if (sentPort === 'notFound') {
            console.log('No spaces found');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });

    it('should handle comma-separated string input for spaceTypes', async () => {
        // Test comma-separated string input
        context.messages.in.content = {
            spaceTypes: 'SPACE,GROUP_CHAT',
            outputType: 'array'
        };

        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`Comma-separated filtered spaces sent to port: ${port}`);
        };

        await FindSpaces.receive(context);

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(sentData.result, 'Result should exist in sent data');
            assert(Array.isArray(sentData.result), 'Result should be an array');
            console.log(`Found ${sentData.result.length} spaces with comma-separated input`);

            // Verify all returned spaces are of allowed types
            sentData.result.forEach(space => {
                assert(['SPACE', 'GROUP_CHAT'].includes(space.spaceType),
                    `Expected SPACE or GROUP_CHAT type, got ${space.spaceType}`);
            });
        } else if (sentPort === 'notFound') {
            console.log('No spaces found for comma-separated input');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });

    it('should handle single string input for spaceTypes', async () => {
        // Test single string input (no commas)
        context.messages.in.content = {
            spaceTypes: 'SPACE',
            outputType: 'array'
        };

        let sentData = null;
        let sentPort = null;
        context.sendJson = async (data, port) => {
            sentData = data;
            sentPort = port;
            console.log(`Single string filtered spaces sent to port: ${port}`);
        };

        await FindSpaces.receive(context);

        if (sentPort === 'out') {
            assert(sentData, 'Sent data should exist');
            assert(sentData.result, 'Result should exist in sent data');
            assert(Array.isArray(sentData.result), 'Result should be an array');
            console.log(`Found ${sentData.result.length} spaces with single string input`);

            // Verify all returned spaces are of type SPACE
            sentData.result.forEach(space => {
                assert(space.spaceType === 'SPACE', `Expected SPACE type, got ${space.spaceType}`);
            });
        } else if (sentPort === 'notFound') {
            console.log('No SPACE type spaces found for single string input');
        } else {
            assert.fail('Expected data to be sent to out or notFound port');
        }
    });
});
