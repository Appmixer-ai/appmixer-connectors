'use strict';
const assert = require('assert');
const { checkAccessTokenOrSkip } = require('./testHelper');

describe('HelpScout core.FindCustomers', () => {

    before(function() {
        checkAccessTokenOrSkip(this);
    });

    it('should receive and send array output', async () => {

        let sendJsonCalled = false;
        let sentData = null;

        const context = {
            messages: {
                in: {
                    content: {
                        outputType: 'array',
                        query: 'test'
                    }
                }
            },
            properties: {},
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                sendJsonCalled = true;
                sentData = data;
                assert.strictEqual(port, 'out');
                assert(Array.isArray(data.result));
                assert(typeof data.count === 'number');
                console.log(`Found ${data.count} customers`);
                return Promise.resolve(data);
            }
        };

        const component = require('../../src/appmixer/helpscout/core/FindCustomers/FindCustomers');
        await component.receive(context);

        assert(sendJsonCalled, 'sendJson should have been called');
        assert(sentData, 'Data should have been sent');
    });

    it('should receive and send first output', async () => {

        let sendJsonCalled = false;
        let sentData = null;

        const context = {
            messages: {
                in: {
                    content: {
                        outputType: 'first'
                    }
                }
            },
            properties: {},
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, port) => {
                sendJsonCalled = true;
                sentData = data;
                assert.strictEqual(port, 'out');
                assert(typeof data === 'object');
                assert(data.id);
                assert(typeof data.index === 'number');
                assert(typeof data.count === 'number');
                console.log(`Customer: ${data.id} (${data.firstName} ${data.lastName})`);
                return Promise.resolve(data);
            },
            CancelError: class extends Error {}
        };

        const component = require('../../src/appmixer/helpscout/core/FindCustomers/FindCustomers');
        await component.receive(context);

        assert(sendJsonCalled, 'sendJson should have been called');
        assert(sentData, 'Data should have been sent');
    });
});
