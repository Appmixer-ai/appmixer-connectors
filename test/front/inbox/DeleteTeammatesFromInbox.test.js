'use strict';

const assert = require('assert');

describe('DeleteTeammatesFromInbox Component', function() {

    let component;

    beforeEach(function() {
        component = require('../../../src/appmixer/front/inbox/DeleteTeammatesFromInbox/DeleteTeammatesFromInbox.js');
    });

    it('should expose receive method', function() {
        assert(typeof component.receive === 'function');
    });

    it('should validate required inboxId input', async function() {
        const context = {
            messages: {
                in: {
                    content: {
                        teammate_ids: 'tea_123,tea_456'
                    }
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

    it('should validate required teammateIds input', async function() {
        const context = {
            messages: {
                in: {
                    content: {
                        inbox_id: 'inb_123'
                    }
                }
            },
            CancelError: class extends Error { }
        };

        try {
            await component.receive(context);
            assert.fail('Should throw CancelError for missing teammateIds');
        } catch (error) {
            assert(error.message === 'Teammate IDs are required.', 'Should throw correct error message');
        }
    });

    it('should parse comma-separated teammate IDs into array', async function() {
        const mockResponse = { success: true };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        inbox_id: 'inb_123',
                        teammate_ids: 'tea_123,tea_456,tea_789'
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

        assert(Array.isArray(requestConfig.data.teammate_ids), 'Should convert teammate IDs to array');
        assert.deepEqual(requestConfig.data.teammate_ids, ['tea_123', 'tea_456', 'tea_789'], 'Should split comma-separated IDs correctly');
    });

    it('should handle single teammate ID', async function() {
        const mockResponse = { success: true };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        inbox_id: 'inb_123',
                        teammate_ids: 'tea_123'
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

        assert(Array.isArray(requestConfig.data.teammate_ids), 'Should convert single teammate ID to array');
        assert.deepEqual(requestConfig.data.teammate_ids, ['tea_123'], 'Should handle single ID correctly');
    });

    it('should make DELETE request to correct URL', async function() {
        const mockResponse = { success: true };

        let requestConfig = null;

        const context = {
            messages: {
                in: {
                    content: {
                        inbox_id: 'inb_123',
                        teammate_ids: 'tea_123,tea_456'
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

        assert(requestConfig.method === 'DELETE', 'Should use DELETE method');
        assert(requestConfig.url === 'https://api2.frontapp.com/inboxes/inb_123/teammates', 'Should use correct URL');
        assert(requestConfig.headers.Authorization === 'Bearer test_token', 'Should use correct authorization header');
        assert(requestConfig.headers['Content-Type'] === 'application/json', 'Should use correct content type');
    });

    it('should send empty object to out port', async function() {
        const mockResponse = { success: true };

        let outputData = null;
        let outputPort = null;

        const context = {
            messages: {
                in: {
                    content: {
                        inbox_id: 'inb_123',
                        teammate_ids: 'tea_123,tea_456'
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

        assert.deepEqual(outputData, {}, 'Should send empty object to output for delete operation');
        assert(outputPort === 'out', 'Should send to out port');
    });
});
