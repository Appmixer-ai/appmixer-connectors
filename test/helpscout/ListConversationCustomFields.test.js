'use strict';

const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('ListConversationCustomFields', () => {

    const componentPath = '../../src/appmixer/helpscout/core/ListConversationCustomFields/ListConversationCustomFields.js';
    let component;

    before(() => {
        component = require(componentPath);
    });

    it('should return list of conversation custom fields (array)', async () => {

        let sendJsonCalled = false;
        let sentData = null;
        
        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            properties: {},
            messages: {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                sendJsonCalled = true;
                sentData = data;
                assert.strictEqual(port, 'out');
                assert(data);
                assert(typeof data === 'object');
                assert(Array.isArray(data.result));
                assert(typeof data.count === 'number');
                console.log(`Found ${data.count} custom fields`);
                return Promise.resolve(data);
            }
        };

        // Execute component
        await component.receive(context);
        
        // Verify that sendJson was called with correct data
        assert(sendJsonCalled, 'sendJson should have been called');
        assert(sentData, 'Data should have been sent');
    });

    it('should generate output port options', async () => {

        // Mock context for output port generation
        const context = {
            properties: {
                generateOutputPortOptions: true
            },
            messages: {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            },
            sendJson: (options, port) => {
                assert.strictEqual(port, 'out');
                assert(Array.isArray(options));
                return options;
            }
        };

        // Execute component
        const result = await component.receive(context);
        assert(result);
    });
});
