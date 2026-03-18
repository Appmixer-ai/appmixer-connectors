'use strict';

const assert = require('assert');
const SendEvents = require('../../core/SendEvents/SendEvents');

describe('LogScale SendEvents', () => {

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

    it('should convert a JSON array to newline-delimited HEC payloads', async () => {
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
            events: '[{"message":"one"},{"message":"two"}]',
            source: 'batch-test',
            type: 'json',
            repository: 'main'
        };

        const result = await SendEvents.receive(context);
        const lines = capturedOptions.data.split('\n').map(line => JSON.parse(line));

        assert.strictEqual(capturedOptions.method, 'POST');
        assert.strictEqual(capturedOptions.headers.Authorization, 'Bearer test-api-key');
        assert.strictEqual(lines.length, 2);
        assert.deepStrictEqual(lines[0], {
            event: { message: 'one' },
            time: 1742316000,
            source: 'batch-test',
            sourcetype: 'json',
            index: 'main'
        });
        assert.deepStrictEqual(lines[1], {
            event: { message: 'two' },
            time: 1742316000,
            source: 'batch-test',
            sourcetype: 'json',
            index: 'main'
        });
        assert.strictEqual(result.data.eventsCount, 2);
    });

    it('should preserve full HEC objects in newline-delimited batches', async () => {
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
            events: '{"event":{"message":"one"},"host":"local-dev"}\n{"event":{"message":"two"},"source":"already-set"}',
            source: 'batch-test'
        };

        await SendEvents.receive(context);
        const lines = capturedOptions.data.split('\n').map(line => JSON.parse(line));

        assert.strictEqual(lines[0].host, 'local-dev');
        assert.strictEqual(lines[0].source, 'batch-test');
        assert.strictEqual(lines[0].time, 1742316000);
        assert.strictEqual(lines[1].source, 'already-set');
        assert.strictEqual(lines[1].time, 1742316000);
    });

    it('should throw CancelError for invalid newline-delimited JSON', async () => {
        context.messages.in.content = {
            events: '{"event":"ok"}\nnot-json'
        };

        try {
            await SendEvents.receive(context);
            assert.fail('Expected CancelError');
        } catch (error) {
            assert(error instanceof context.CancelError);
            assert.strictEqual(error.message, 'Each batch line must be valid JSON.');
        }
    });
});