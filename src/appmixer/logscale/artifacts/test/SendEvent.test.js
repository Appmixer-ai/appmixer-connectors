'use strict';

const assert = require('assert');
const SendEvent = require('../../core/SendEvent/SendEvent');

describe('LogScale SendEvent', () => {

    let context;
    let originalNow;

    beforeEach(() => {
        originalNow = Date.now;
        Date.now = () => 1742316000000;

        context = {
            auth: {
                url: 'https://example.ingest.us-2.crowdstrike.com/services/collector',
                apiKey: 'test-api-key'
            },
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: async (options) => ({
                status: 200,
                headers: {
                    'content-type': 'application/json'
                },
                data: {
                    text: 'Success',
                    code: 0,
                    options
                }
            }),
            sendJson: async (data, port) => ({ data, port }),
            CancelError: class extends Error {}
        };
    });

    afterEach(() => {
        Date.now = originalNow;
    });

    it('should map JSON event strings to the HEC request body', async () => {
        let capturedOptions;
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                status: 200,
                headers: {
                    'content-type': 'application/json'
                },
                data: {
                    text: 'Success',
                    code: 0
                }
            };
        };

        context.messages.in.content = {
            event: '{"message":"hello","service":"appmixer"}',
            source: 'appmixer-test',
            type: 'json',
            repository: 'main'
        };

        const result = await SendEvent.receive(context);

        assert.strictEqual(capturedOptions.method, 'POST');
        assert.strictEqual(capturedOptions.url, context.auth.url);
        assert.strictEqual(capturedOptions.headers.Authorization, 'Bearer test-api-key');
        assert.strictEqual(capturedOptions.data.source, 'appmixer-test');
        assert.strictEqual(capturedOptions.data.sourcetype, 'json');
        assert.strictEqual(capturedOptions.data.index, 'main');
        assert.strictEqual(capturedOptions.data.time, 1742316000);
        assert.deepStrictEqual(capturedOptions.data.event, {
            message: 'hello',
            service: 'appmixer'
        });
        assert.strictEqual(result.port, 'out');
        assert.deepStrictEqual(result.data.requestBody, capturedOptions.data);
    });

    it('should keep plain text events as strings', async () => {
        let capturedOptions;
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                status: 200,
                headers: {},
                data: {
                    text: 'Success',
                    code: 0
                }
            };
        };

        context.messages.in.content = {
            event: 'plain-text-event'
        };

        await SendEvent.receive(context);

        assert.strictEqual(capturedOptions.data.event, 'plain-text-event');
        assert.strictEqual(capturedOptions.data.time, 1742316000);
    });

    it('should throw CancelError when event is missing', async () => {
        try {
            await SendEvent.receive(context);
            assert.fail('Expected CancelError');
        } catch (error) {
            assert(error instanceof context.CancelError);
            assert.strictEqual(error.message, 'Event is required!');
        }
    });
});
