const assert = require('assert');
const lib = require('../../lib');

class CancelError extends Error {}

const ctx = (endpoint, config = {}) => ({ auth: { endpoint, apiKey: 'test-key' }, config, CancelError });

describe('ai/foundry lib', () => {

    describe('endpointOrigin', () => {

        it('accepts the forms users copy from the Azure and Foundry portals', () => {
            const cases = {
                'https://my-res.openai.azure.com': 'https://my-res.openai.azure.com',
                'https://my-res.openai.azure.com/': 'https://my-res.openai.azure.com',
                'https://my-res.openai.azure.com/openai/v1/': 'https://my-res.openai.azure.com',
                'https://my-res.services.ai.azure.com/api/projects/my-project': 'https://my-res.services.ai.azure.com',
                'https://my-res.cognitiveservices.azure.com/': 'https://my-res.cognitiveservices.azure.com',
                'my-res.openai.azure.com': 'https://my-res.openai.azure.com',
                '  https://MY-RES.openai.azure.com  ': 'https://my-res.openai.azure.com'
            };
            for (const [input, expected] of Object.entries(cases)) {
                assert.strictEqual(lib.endpointOrigin(ctx(input)), expected, input);
            }
        });

        it('reads the fields of an auth context too (no context.auth there)', () => {
            assert.strictEqual(lib.endpointOrigin({ endpoint: 'https://x.openai.azure.com', apiKey: 'k', config: {} }),
                'https://x.openai.azure.com');
        });

        it('refuses hosts outside Azure, look-alikes and plain http', () => {
            for (const input of [
                'https://api.openai.com/v1',
                'https://openai.azure.com',
                'https://my-res.openai.azure.com.evil.com',
                'https://evil.com/my-res.openai.azure.com',
                'https://my-resopenai.azure.com.example',
                'http://my-res.openai.azure.com',
                'https://user:pass@my-res.openai.azure.com',
                ''
            ]) {
                assert.throws(() => lib.endpointOrigin(ctx(input)), Error, input);
            }
        });

        it('allows the hosts added in the connector configuration', () => {
            const config = { allowedEndpointHosts: 'azure-api.net, .example.org' };
            assert.strictEqual(lib.endpointOrigin(ctx('https://gw.azure-api.net/', config)), 'https://gw.azure-api.net');
            assert.strictEqual(lib.endpointOrigin(ctx('https://a.example.org', config)), 'https://a.example.org');
            assert.throws(() => lib.endpointOrigin(ctx('https://gw.azure-api.net/')));
        });
    });

    describe('sdk', () => {

        it('points the OpenAI client at the v1 API of the resource with the API key', () => {
            const client = lib.sdk(ctx('https://my-res.openai.azure.com/'));
            assert.strictEqual(client.baseURL, 'https://my-res.openai.azure.com/openai/v1');
            assert.strictEqual(client.apiKey, 'test-key');
        });
    });

    describe('request', () => {

        it('sends the api-key header to the v1 API of the resource', async () => {
            const calls = [];
            const context = {
                ...ctx('https://my-res.services.ai.azure.com/api/projects/p'),
                httpRequest: {
                    get: async (url, opts) => {
                        calls.push({ url, opts });
                        return { data: {} };
                    },
                    post: async (url, data, opts) => {
                        calls.push({ url, data, opts });
                        return { data: {} };
                    }
                }
            };
            await lib.request(context, 'get', '/models');
            await lib.request(context, 'post', '/chat/completions', { a: 1 });
            assert.strictEqual(calls[0].url, 'https://my-res.services.ai.azure.com/openai/v1/models');
            assert.strictEqual(calls[0].opts.headers['api-key'], 'test-key');
            assert.strictEqual(calls[1].url, 'https://my-res.services.ai.azure.com/openai/v1/chat/completions');
            assert.deepStrictEqual(calls[1].data, { a: 1 });
        });
    });

    describe('resolveApiUrl', () => {

        const context = ctx('https://my-res.openai.azure.com');

        it('resolves relative paths against the v1 API, /openai/ and /api/ paths against the resource', () => {
            assert.strictEqual(lib.resolveApiUrl(context, '/chat/completions'),
                'https://my-res.openai.azure.com/openai/v1/chat/completions');
            assert.strictEqual(lib.resolveApiUrl(context, 'models'), 'https://my-res.openai.azure.com/openai/v1/models');
            assert.strictEqual(lib.resolveApiUrl(context, '/openai/deployments?api-version=2024-10-21'),
                'https://my-res.openai.azure.com/openai/deployments?api-version=2024-10-21');
            assert.strictEqual(lib.resolveApiUrl(context, '/api/projects/p/assistants'),
                'https://my-res.openai.azure.com/api/projects/p/assistants');
            assert.strictEqual(lib.resolveApiUrl(context, 'https://my-res.openai.azure.com/openai/v1/files'),
                'https://my-res.openai.azure.com/openai/v1/files');
        });

        it('refuses any other origin', () => {
            for (const url of [
                'https://api.openai.com/v1/models',
                '//evil.com/x',
                'https://other-res.openai.azure.com/openai/v1/models',
                'https://user:pw@my-res.openai.azure.com/openai/v1/models',
                'http://my-res.openai.azure.com/openai/v1/models'
            ]) {
                assert.throws(() => lib.resolveApiUrl(context, url), CancelError, url);
            }
        });
    });
});
