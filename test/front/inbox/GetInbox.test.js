'use strict';

const assert = require('assert');

describe('GetInbox Component', function() {

    let component;

    beforeEach(function() {
        component = require('../../../src/appmixer/front/inbox/GetInbox/GetInbox.js');
    });

    it('should expose receive method', function() {
        assert(typeof component.receive === 'function');
    });

    it('should validate required inboxId input', async function() {
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
            assert.fail('Should throw CancelError for missing inboxId');
        } catch (error) {
            assert(error.message === 'Inbox ID is required.', 'Should throw correct error message');
        }
    });

    it('should make GET request to correct URL', async function() {
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
                        inbox_id: 'inb_12345'
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

        assert(requestConfig.method === 'GET', 'Should use GET method');
        assert(requestConfig.url === 'https://api2.frontapp.com/inboxes/inb_12345', 'Should use correct URL');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
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
                        inbox_id: 'inb_12345'
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
