'use strict';

const assert = require('assert');
const path = require('path');

// Mock the lib module
const mockLib = {
    sendArrayOutput: ({ context, records, outputType }) => {
        return context.sendJson(records, 'out');
    }
};

describe('ListInboxes Component', function() {

    let component;
    let originalRequire;

    beforeEach(function() {
        // Mock require for lib module
        originalRequire = require.cache[path.resolve(__dirname, '../../../src/appmixer/front/lib.js')];
        require.cache[path.resolve(__dirname, '../../../src/appmixer/front/lib.js')] = {
            exports: mockLib
        };

        component = require('../../../src/appmixer/front/inbox/ListInboxes/ListInboxes.js');
    });

    afterEach(function() {
        // Restore original require
        if (originalRequire) {
            require.cache[path.resolve(__dirname, '../../../src/appmixer/front/lib.js')] = originalRequire;
        } else {
            delete require.cache[path.resolve(__dirname, '../../../src/appmixer/front/lib.js')];
        }
    });

    it('should expose receive method', function() {
        assert(typeof component.receive === 'function');
    });

    it('should make GET request to correct URL', async function() {
        const mockResponse = [
            {
                id: 'inb_12345',
                name: 'Support Inbox',
                address: 'support@example.com'
            },
            {
                id: 'inb_67890',
                name: 'Sales Inbox',
                address: 'sales@example.com'
            }
        ];

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            properties: {},
            httpRequest: async (config) => {
                requestConfig = config;
                return { data: { _results: mockResponse } };
            },
            sendJson: (data, port) => {
                return { data, port };
            }
        };

        await component.receive(context);

        assert(requestConfig.method === 'GET', 'Should use GET method');
        assert(requestConfig.url === 'https://api2.frontapp.com/inboxes', 'Should use correct URL');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
    });

    it('should send response array to out port', async function() {
        const mockResponse = [
            {
                id: 'inb_12345',
                name: 'Support Inbox',
                address: 'support@example.com'
            },
            {
                id: 'inb_67890',
                name: 'Sales Inbox',
                address: 'sales@example.com'
            }
        ];

        let outputData = null;
        let outputPort = null;

        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            properties: {},
            httpRequest: async () => ({ data: { _results: mockResponse } }),
            sendJson: (data, port) => {
                outputData = data;
                outputPort = port;
                return { data, port };
            }
        };

        await component.receive(context);

        assert.deepEqual(outputData, mockResponse, 'Should send response data to output');
        assert(outputPort === 'out', 'Should send to out port');
    });

    it('should handle empty inbox list', async function() {
        const mockResponse = [];

        let outputData = null;
        let outputPort = null;

        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            properties: {},
            httpRequest: async () => ({ data: { _results: mockResponse } }),
            sendJson: (data, port) => {
                outputData = data;
                outputPort = port;
                return { data, port };
            }
        };

        await component.receive(context);

        assert.deepEqual(outputData, [], 'Should send empty array for no inboxes');
        assert(outputPort === 'out', 'Should send to out port');
    });
});
