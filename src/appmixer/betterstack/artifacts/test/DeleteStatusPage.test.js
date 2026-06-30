'use strict';

const assert = require('assert');
const DeleteStatusPage = require('../../statuspages/DeleteStatusPage/DeleteStatusPage');

describe('DeleteStatusPage', () => {

    let context;

    beforeEach(() => {
        context = {
            auth: {
                apiKey: 'test-api-key'
            },
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: async () => ({}),
            sendJson: async (data, port) => ({ data, port }),
            CancelError: class extends Error {}
        };
    });

    it('should throw error when status page ID is missing', async () => {
        context.messages.in.content = {};

        try {
            await DeleteStatusPage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Status page ID is required'));
        }
    });

    it('should delete a status page', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {};
        };

        context.messages.in.content = {
            statusPageId: '123456789'
        };

        const result = await DeleteStatusPage.receive(context);

        assert.deepStrictEqual(result.data, {});
        assert.strictEqual(capturedOptions.method, 'DELETE');
        assert.strictEqual(capturedOptions.url, 'https://uptime.betterstack.com/api/v2/status-pages/123456789');
    });

    it('should include Authorization header', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {};
        };

        context.messages.in.content = {
            statusPageId: '123456789'
        };

        await DeleteStatusPage.receive(context);

        assert(capturedOptions.headers.Authorization.includes('Bearer'));
    });

    it('should return empty object on successful deletion', async () => {
        context.httpRequest = async () => ({});

        context.messages.in.content = {
            statusPageId: '123456789'
        };

        const result = await DeleteStatusPage.receive(context);

        assert.strictEqual(result.port, 'out');
        assert.deepStrictEqual(result.data, {});
    });
});
