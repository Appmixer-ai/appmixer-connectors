'use strict';

const assert = require('assert');

describe('GetRule Component', function() {

    let component;

    beforeEach(function() {
        component = require('../../../src/appmixer/front/rule/GetRule/GetRule.js');
    });

    it('should expose receive method', function() {
        assert(typeof component.receive === 'function');
    });

    it('should require ruleId parameter', async function() {
        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should throw error for missing ruleId');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Rule ID'), 'Error should mention Rule ID');
        }
    });

    it('should make GET request to correct URL with ruleId', async function() {
        const mockResponse = {
            id: 'rul_12345',
            name: 'Test Rule',
            description: 'A test automation rule',
            is_active: true
        };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        ruleId: 'rul_12345'
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            httpRequest: async (config) => {
                requestConfig = config;
                return { data: mockResponse };
            },
            sendJson: (data, port) => {
                return { data, port };
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        await component.receive(context);

        assert(requestConfig.method === 'GET', 'Should use GET method');
        assert(requestConfig.url === 'https://api2.frontapp.com/rules/rul_12345', 'Should use correct URL with ruleId');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
    });

    it('should send rule data to out port', async function() {
        const mockResponse = {
            id: 'rul_12345',
            name: 'Test Rule',
            description: 'A test automation rule',
            is_active: true
        };

        let outputData = null;
        let outputPort = null;

        const context = {
            messages: {
                in: {
                    content: {
                        ruleId: 'rul_12345'
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            httpRequest: async () => ({ data: mockResponse }),
            sendJson: (data, port) => {
                outputData = data;
                outputPort = port;
                return { data, port };
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        await component.receive(context);

        assert.deepEqual(outputData, mockResponse, 'Should send rule data to output');
        assert(outputPort === 'out', 'Should send to out port');
    });

    it('should handle HTTP errors gracefully', async function() {
        const context = {
            messages: {
                in: {
                    content: {
                        ruleId: 'rul_nonexistent'
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            httpRequest: async () => {
                const error = new Error('Rule not found');
                error.response = { status: 404 };
                throw error;
            },
            sendJson: (data, port) => {
                return { data, port };
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        try {
            await component.receive(context);
            assert.fail('Should throw error for non-existent rule');
        } catch (error) {
            assert(error.message === 'Rule not found', 'Should propagate original error');
        }
    });
});
