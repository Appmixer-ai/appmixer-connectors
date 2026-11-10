'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const createChart = require('../../core/CreateChart/CreateChart');
const createChartFromPrompt = require('../../core/CreateChartFromPrompt/CreateChartFromPrompt');
const createQrCode = require('../../core/CreateQrCode/CreateQrCode');
const createBarcode = require('../../core/CreateBarcode/CreateBarcode');
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

describe('ChartQuery connector', () => {

    it('validates the key with GET /v1/usage', async () => {
        const calls = [];
        const ok = await auth.definition.validate({ apiKey: 'test-api-key-material', httpRequest: async options => { calls.push(options); return { data: {} }; } });
        assert.equal(ok, true);
        assert.equal(calls[0].url, 'https://api.chartquery.com/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
    });

    it('reports a 401 as an invalid key', async () => {
        const httpRequest = async () => { const err = new Error('401'); err.response = { status: 401 }; throw err; };
        await assert.rejects(() => auth.definition.validate({ apiKey: 'bad', httpRequest }), /Invalid ChartQuery API key/);
    });

    it('masks the key in the profile', async () => {
        const profile = await auth.definition.requestProfileInfo({ apiKey: 'abcdefgh12345678wxyz' });
        assert.equal(profile.key, 'abcdefgh...wxyz');
    });

    it('puts the API error message on the thrown error', async () => {
        const ctx = contextFor({ config: '{}' }, async () => {
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: 'Invalid query' } };
            throw err;
        });
        await assert.rejects(() => createChart.receive(ctx), /ChartQuery: Invalid query/);
    });

    it('Create Chart calls GET /v1/chart with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ config: '{"type":"bar","data":{"labels":["a"],"datasets":[{"data":[1]}]}}' }, async options => {
            calls.push(options);
            return { data: { id: 'cq-1', render_url: 'https://api.chartquery.com/v1/chart/render/cq-1', view_url: 'https://api.chartquery.com/v1/chart/view/cq-1' } };
        });
        await createChart.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.chartquery.com/v1/chart');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: '{"type":"bar","data":{"labels":["a"],"datasets":[{"data":[1]}]}}', share: 'true' });
        assert.deepEqual(ctx.output.data, { id: 'cq-1', render_url: 'https://api.chartquery.com/v1/chart/render/cq-1', view_url: 'https://api.chartquery.com/v1/chart/view/cq-1' });
    });
    it('Create Chart cancels without Chart Config', async () => {
        const ctx = contextFor({ config: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => createChart.receive(ctx), CancelError);
    });
    it('Create Chart From Prompt calls GET /v1/chart/ai with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ prompt: 'Bar chart of sales', rawData: 'value' }, async options => {
            calls.push(options);
            return { data: { id: 'cq-2', render_url: 'https://api.chartquery.com/v1/chart/render/cq-2' } };
        });
        await createChartFromPrompt.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.chartquery.com/v1/chart/ai');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { prompt: 'Bar chart of sales', raw_data: 'value', share: 'true' });
        assert.deepEqual(ctx.output.data, { id: 'cq-2', render_url: 'https://api.chartquery.com/v1/chart/render/cq-2' });
    });
    it('Create Chart From Prompt cancels without Prompt', async () => {
        const ctx = contextFor({ prompt: '', rawData: 'value' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => createChartFromPrompt.receive(ctx), CancelError);
    });
    it('Create QR Code calls GET /v1/qrcode with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ data: 'HELLO-123', format: 'svg', size: 'value' }, async options => {
            calls.push(options);
            return { data: { id: 'cq-3', render_url: 'https://api.chartquery.com/v1/qrcode/render/cq-3' } };
        });
        await createQrCode.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.chartquery.com/v1/qrcode');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { data: 'HELLO-123', format: 'svg', size: 'value', share: 'true' });
        assert.deepEqual(ctx.output.data, { id: 'cq-3', render_url: 'https://api.chartquery.com/v1/qrcode/render/cq-3' });
    });
    it('Create QR Code cancels without Data', async () => {
        const ctx = contextFor({ data: '', format: 'svg', size: 'value' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => createQrCode.receive(ctx), CancelError);
    });
    it('Create Barcode calls GET /v1/barcode with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ data: 'HELLO-123', type: 'code128', format: 'svg' }, async options => {
            calls.push(options);
            return { data: { id: 'cq-4', render_url: 'https://api.chartquery.com/v1/barcode/render/cq-4' } };
        });
        await createBarcode.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.chartquery.com/v1/barcode');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { data: 'HELLO-123', type: 'code128', format: 'svg', share: 'true' });
        assert.deepEqual(ctx.output.data, { id: 'cq-4', render_url: 'https://api.chartquery.com/v1/barcode/render/cq-4' });
    });
    it('Create Barcode cancels without Data', async () => {
        const ctx = contextFor({ data: '', type: 'code128', format: 'svg' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => createBarcode.receive(ctx), CancelError);
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
        assert.equal(calls[0].url, 'https://api.chartquery.com/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' });
    });

    it('Make API Call sends the key only to the ChartQuery API', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/v1/usage', method: 'GET', headers: '{"x-api-key":"evil","X-Test":"1"}' }, async options => {
            calls.push(options);
            return { status: 200, headers: {}, data: { ok: true } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].url, 'https://api.chartquery.com/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.equal(calls[0].headers['X-Test'], '1');
        assert.deepEqual(ctx.output.data, { statusCode: 200, headers: {}, body: { ok: true } });

        const other = contextFor({ url: 'https://evil.example.com/steal', method: 'GET' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(other), CancelError);
    });

    it('resolves relative paths on the API host', () => {
        const ctx = contextFor({}, null);
        assert.equal(lib.resolveApiUrl(ctx, 'v1/usage'), 'https://api.chartquery.com/v1/usage');
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://user:pass@api.chartquery.com/x'), CancelError);
    });
});
