'use strict';

const assert = require('assert');
const path = require('path');

// Mock the lib module
const mockLib = {
    getOutputPortOptions: (context, outputType, schema, options) => {
        return context.sendJson([options], 'out');
    },
    sendArrayOutput: ({ context, records, outputType }) => {
        return context.sendJson(records, 'out');
    }
};

describe('ListRules Component', function() {

    let component;
    let originalRequire;

    beforeEach(function() {
        // Mock require for lib module
        originalRequire = require.cache[path.resolve(__dirname, '../../../src/appmixer/front/lib.js')];
        require.cache[path.resolve(__dirname, '../../../src/appmixer/front/lib.js')] = {
            exports: mockLib
        };

        component = require('../../../src/appmixer/front/rule/ListRules/ListRules.js');
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
                id: 'rul_12345',
                name: 'Test Rule',
                description: 'A test automation rule',
                is_active: true
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
        assert(requestConfig.url === 'https://api2.frontapp.com/rules', 'Should use correct URL');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
    });

    it('should include limit parameter when provided', async function() {
        const mockResponse = [];

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        limit: 50
                    }
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

        assert(requestConfig.params.limit === 50, 'Should include limit parameter');
    });

    it('should send response array to out port', async function() {
        const mockResponse = [
            {
                id: 'rul_12345',
                name: 'Test Rule',
                description: 'A test automation rule'
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

    it('should handle empty rules list', async function() {
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

        assert.deepEqual(outputData, [], 'Should send empty array for no rules');
        assert(outputPort === 'out', 'Should send to out port');
    });
});
