const assert = require('assert');
const lib = require('../../lib');

describe('ai/openai lib', () => {
    describe('formatBytes', () => {
        it('formats bytes into human readable strings', () => {
            assert.strictEqual(lib.formatBytes(0), '0 Bytes');
            // for 1024 bytes the result may be '1 KiB' (strip trailing zeros) — just check unit
            const oneKi = lib.formatBytes(1024);
            assert.ok(oneKi.includes('KiB'));
            // large number
            const large = lib.formatBytes(1024 * 1024 * 5);
            assert.ok(large.includes('MiB'));
        });
    });

    describe('request', () => {
        it('uses GET method and calls context.httpRequest.get', async () => {
            const calls = [];
            const context = {
                apiKey: 'k',
                auth: { apiKey: 'auth-k' },
                config: {},
                httpRequest: {
                    get: async (url, opts) => {
                        calls.push({ url, opts });
                        return { ok: true };
                    }
                }
            };

            const res = await lib.request(context, 'get', '/test', null);
            assert.deepStrictEqual(res, { ok: true });
            assert.strictEqual(calls.length, 1);
            assert.ok(calls[0].url.endsWith('/test'));
            assert.ok(calls[0].opts.headers['Authorization'].includes('Bearer'));
        });

        it('uses POST method and calls context.httpRequest.post with data and headers', async () => {
            const calls = [];
            const context = {
                apiKey: 'k',
                auth: { apiKey: 'auth-k' },
                config: { llmBaseUrl: 'https://example.com' },
                httpRequest: {
                    post: async (url, data, opts) => {
                        calls.push({ url, data, opts });
                        return { data: 'posted' };
                    }
                }
            };

            const payload = { hello: 'world' };
            const res = await lib.request(context, 'post', '/chat', payload);
            assert.deepStrictEqual(res, { data: 'posted' });
            assert.strictEqual(calls.length, 1);
            assert.strictEqual(calls[0].data, payload);
            assert.ok(calls[0].opts.headers['Authorization'].includes('Bearer'));
        });
    });
});
