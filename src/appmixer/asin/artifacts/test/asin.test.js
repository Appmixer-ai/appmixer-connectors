'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const searchAmazon = require('../../core/SearchAmazon/SearchAmazon');
const getPriceHistory = require('../../core/GetPriceHistory/GetPriceHistory');
const getOffers = require('../../core/GetOffers/GetOffers');
const getAccount = require('../../core/GetAccount/GetAccount');
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

describe('Asin connector', () => {

    it('validates the key with GET /api/v1/account', async () => {
        const calls = [];
        const ok = await auth.definition.validate({ apiKey: 'test-api-key-material', httpRequest: async options => { calls.push(options); return { data: {} }; } });
        assert.equal(ok, true);
        assert.equal(calls[0].url, 'https://www.asin.dev/api/v1/account');
        assert.equal(calls[0].headers['Authorization'], 'Bearer test-api-key-material');
    });

    it('reports a 401 as an invalid key', async () => {
        const httpRequest = async () => { const err = new Error('401'); err.response = { status: 401 }; throw err; };
        await assert.rejects(() => auth.definition.validate({ apiKey: 'bad', httpRequest }), /Invalid Asin API key/);
    });

    it('masks the key in the profile', async () => {
        const profile = await auth.definition.requestProfileInfo({ apiKey: 'abcdefgh12345678wxyz' });
        assert.equal(profile.key, 'abcdefgh...wxyz');
    });

    it('puts the API error message on the thrown error', async () => {
        const ctx = contextFor({ query: 'x', marketplace: 'com' }, async () => {
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: { code: 'invalid_option', message: 'Invalid query' } } };
            throw err;
        });
        await assert.rejects(() => searchAmazon.receive(ctx), /Asin: Invalid query/);
    });

    it('Search Amazon calls GET /api/v1/search with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ query: 'test query', marketplace: 'com', outputType: 'array' }, async options => {
            calls.push(options);
            return { data: { results: [{ asin: 'B0CZY1LRT4', title: 'Kindle', price: 177.99, currency: 'USD', rating: 4.5, reviews_count: 2377 }] } };
        });
        await searchAmazon.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://www.asin.dev/api/v1/search');
        assert.equal(calls[0].headers['Authorization'], 'Bearer test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'test query', marketplace: 'com' });
        assert.equal(ctx.output.port, 'out');
        assert.ok(Array.isArray(ctx.output.data.result));
        assert.ok(ctx.output.data.result.length >= 1);
    });
    it('Search Amazon cancels without Query', async () => {
        const ctx = contextFor({ query: '', marketplace: 'com', outputType: 'array' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => searchAmazon.receive(ctx), CancelError);
    });
    it('Search Amazon sends notFound when there is no result', async () => {
        const ctx = contextFor({ query: 'test query', marketplace: 'com', outputType: 'array' }, async () => ({ data: {} }));
        await searchAmazon.receive(ctx);
        assert.equal(ctx.output.port, 'notFound');
    });
    it('Get Price History calls GET /api/v1/history with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ asin: 'B0CZY1LRT4', marketplace: 'com', days: 'value' }, async options => {
            calls.push(options);
            return { data: { asin: 'B0CZY1LRT4', currency: 'USD', history: [] } };
        });
        await getPriceHistory.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://www.asin.dev/api/v1/history');
        assert.equal(calls[0].headers['Authorization'], 'Bearer test-api-key-material');
        assert.deepEqual(calls[0].params, { asin: 'B0CZY1LRT4', marketplace: 'com', days: 'value' });
        assert.deepEqual(ctx.output.data, { asin: 'B0CZY1LRT4', currency: 'USD', history: [] });
    });
    it('Get Price History cancels without ASIN', async () => {
        const ctx = contextFor({ asin: '', marketplace: 'com', days: 'value' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => getPriceHistory.receive(ctx), CancelError);
    });
    it('Get Offers calls GET /api/v1/offers with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ asin: 'B0CZY1LRT4', marketplace: 'com' }, async options => {
            calls.push(options);
            return { data: { asin: 'B0CZY1LRT4', offers: [] } };
        });
        await getOffers.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://www.asin.dev/api/v1/offers');
        assert.equal(calls[0].headers['Authorization'], 'Bearer test-api-key-material');
        assert.deepEqual(calls[0].params, { asin: 'B0CZY1LRT4', marketplace: 'com' });
        assert.deepEqual(ctx.output.data, { asin: 'B0CZY1LRT4', offers: [] });
    });
    it('Get Offers cancels without ASIN', async () => {
        const ctx = contextFor({ asin: '', marketplace: 'com' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => getOffers.receive(ctx), CancelError);
    });
    it('Get Account calls GET /api/v1/account with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({}, async options => {
            calls.push(options);
            return { data: { plan_name: 'Starter', credits: 29588 } };
        });
        await getAccount.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://www.asin.dev/api/v1/account');
        assert.equal(calls[0].headers['Authorization'], 'Bearer test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { plan_name: 'Starter', credits: 29588 });
    });

    it('Make API Call sends the key only to the Asin API', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/api/v1/account', method: 'GET', headers: '{"Authorization":"evil","X-Test":"1"}' }, async options => {
            calls.push(options);
            return { status: 200, headers: {}, data: { ok: true } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].url, 'https://www.asin.dev/api/v1/account');
        assert.equal(calls[0].headers['Authorization'], 'Bearer test-api-key-material');
        assert.equal(calls[0].headers['X-Test'], '1');
        assert.deepEqual(ctx.output.data, { statusCode: 200, headers: {}, body: { ok: true } });

        const other = contextFor({ url: 'https://evil.example.com/steal', method: 'GET' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(other), CancelError);
    });

    it('resolves relative paths on the API host', () => {
        const ctx = contextFor({}, null);
        assert.equal(lib.resolveApiUrl(ctx, 'api/v1/account'), 'https://www.asin.dev/api/v1/account');
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://user:pass@www.asin.dev/x'), CancelError);
    });
});
