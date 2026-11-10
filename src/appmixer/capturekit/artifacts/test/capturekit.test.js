'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const getPageContent = require('../../core/GetPageContent/GetPageContent');
const getUsage = require('../../core/GetUsage/GetUsage');
const makeApiCall = require('../../core/MakeApiCall/MakeApiCall');

class CancelError extends Error {}

function contextFor(content, httpRequest, properties = {}) {

    const output = { sent: [] };
    return {
        output,
        auth: { apiKey: 'test-api-key-material' },
        messages: { in: { content } },
        properties,
        httpRequest,
        CancelError,
        sendJson: (data, port) => {
            output.sent.push({ data, port });
            output.data = data;
            output.port = port;
            return { data, port };
        }
    };
}

describe('CaptureKit connector', () => {

    it('validates the key with GET /v1/usage', async () => {
        const calls = [];
        const ok = await auth.definition.validate({ apiKey: 'test-api-key-material', httpRequest: async options => { calls.push(options); return { data: {} }; } });
        assert.equal(ok, true);
        assert.equal(calls[0].url, 'https://api.capturekit.dev/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
    });

    it('reports a 401 as an invalid key', async () => {
        const httpRequest = async () => { const err = new Error('401'); err.response = { status: 401 }; throw err; };
        await assert.rejects(() => auth.definition.validate({ apiKey: 'bad', httpRequest }), /Invalid CaptureKit API key/);
    });

    it('masks the key in the profile', async () => {
        const profile = await auth.definition.requestProfileInfo({ apiKey: 'abcdefgh12345678wxyz' });
        assert.equal(profile.key, 'abcdefgh...wxyz');
    });

    it('puts the API error message on the thrown error', async () => {
        const ctx = contextFor({ url: 'x', mainContentOnly: 'true' }, async () => {
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: 'Invalid query' } };
            throw err;
        });
        await assert.rejects(() => getPageContent.receive(ctx), /CaptureKit: Invalid query/);
    });

    it('Get Page Content calls GET /v1/content with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ url: 'https://example.com', mainContentOnly: 'true' }, async options => {
            calls.push(options);
            return { data: { success: true, data: { metadata: { title: 'Example Domain' }, links: { internal: [], external: [] }, markdown: 'Example Domain' } } };
        });
        await getPageContent.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.capturekit.dev/v1/content');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { url: 'https://example.com', use_defuddle: 'true', include_markdown: 'true', remove_cookie_banners: 'true' });
        assert.deepEqual(ctx.output.data, { metadata: { title: 'Example Domain' }, links: { internal: [], external: [] }, markdown: 'Example Domain' });
    });
    it('Get Page Content cancels without URL', async () => {
        const ctx = contextFor({ url: '', mainContentOnly: 'true' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => getPageContent.receive(ctx), CancelError);
    });
    it('Get Usage calls GET /v1/usage with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({}, async options => {
            calls.push(options);
            return { data: { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' } };
        });
        await getUsage.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.capturekit.dev/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' });
    });

    it('Make API Call sends the key only to the CaptureKit API', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/v1/usage', method: 'GET', headers: '{"x-api-key":"evil","X-Test":"1"}' }, async options => {
            calls.push(options);
            return { status: 200, headers: {}, data: { ok: true } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].url, 'https://api.capturekit.dev/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.equal(calls[0].headers['X-Test'], '1');
        assert.deepEqual(ctx.output.data, { statusCode: 200, headers: {}, body: { ok: true } });

        const other = contextFor({ url: 'https://evil.example.com/steal', method: 'GET' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(other), CancelError);
    });

    it('resolves relative paths on the API host', () => {
        const ctx = contextFor({}, null);
        assert.equal(lib.resolveApiUrl(ctx, 'v1/usage'), 'https://api.capturekit.dev/v1/usage');
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://user:pass@api.capturekit.dev/x'), CancelError);
    });
});
