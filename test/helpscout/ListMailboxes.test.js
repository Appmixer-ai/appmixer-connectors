'use strict';

const assert = require('assert');
const { checkAccessTokenOrSkip } = require('./testHelper');

describe('ListMailboxes', () => {

    const componentPath = '../../src/appmixer/helpscout/core/ListMailboxes/ListMailboxes.js';
    let component;

    before(function() {
        // Skip all tests if no access token is available
        checkAccessTokenOrSkip(this);
        component = require(componentPath);
    });

    it('should return list of mailboxes (array)', async () => {

        // Mock context with tracking
        let sendJsonCalled = false;
        let sentData = null;

        const context = {
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            properties: {},  // Add properties object
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
                assert(options.length > 0);
                return options;
            }
        };

        // Execute component
        const result = await component.receive(context);
        assert(result);
    });
});
