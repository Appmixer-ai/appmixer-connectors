'use strict';

const assert = require('assert');

describe('CreateInbox Component', function() {

    let component;

    beforeEach(function() {
        component = require('../../../src/appmixer/front/inbox/CreateInbox/CreateInbox.js');
    });

    it('should expose receive method', function() {
        assert(typeof component.receive === 'function');
    });

    it('should validate required name input', async function() {
        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            CancelError: class extends Error { }
        };

        try {
            await component.receive(context);
            assert.fail('Should throw CancelError for missing name');
        } catch (error) {
            assert(error.message === 'Inbox name is required.', 'Should throw correct error message');
        }
    });

    it('should make POST request to correct URL with required fields', async function() {
        const mockResponse = {
            id: 'inb_12345',
            name: 'Test Inbox',
            address: 'test@example.com'
        };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        name: 'Test Inbox'
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            CancelError: Error,
            httpRequest: async (config) => {
                requestConfig = config;
                return { data: mockResponse };
            },
            sendJson: (data, port) => {
                return { data, port };
            }
        };

        await component.receive(context);

        assert(requestConfig.method === 'POST', 'Should use POST method');
        assert(requestConfig.url === 'https://api2.frontapp.com/inboxes', 'Should use correct URL');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
        assert(requestConfig.headers['Content-Type'] === 'application/json', 'Should use correct content type');
        assert(requestConfig.data.name === 'Test Inbox', 'Should include name in request data');
    });

    it('should include optional isPrivate field when provided', async function() {
        const mockResponse = {
            id: 'inb_12345',
            name: 'Private Inbox',
            address: 'private@example.com'
        };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        name: 'Private Inbox',
                        is_private: true
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            CancelError: Error,
            httpRequest: async (config) => {
                requestConfig = config;
                return { data: mockResponse };
            },
            sendJson: (data, port) => {
                return { data, port };
            }
        };

        await component.receive(context);

        assert(requestConfig.data.name === 'Private Inbox', 'Should include name in request data');
        assert(requestConfig.data.is_private === true, 'Should include is_private field');
    });

    it('should send response to out port', async function() {
        const mockResponse = {
            id: 'inb_12345',
            name: 'Test Inbox',
            address: 'test@example.com'
        };

        let outputData = null;
        let outputPort = null;

        const context = {
            messages: {
                in: {
                    content: {
                        name: 'Test Inbox'
                    }
                }
            },
            auth: {
                accessToken: 'test_token'
            },
            CancelError: Error,
            httpRequest: async () => ({ data: mockResponse }),
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
});
