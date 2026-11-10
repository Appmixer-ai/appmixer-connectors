'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const checkEmail = require('../../core/CheckEmail/CheckEmail');
const checkDomain = require('../../core/CheckDomain/CheckDomain');
const checkIp = require('../../core/CheckIp/CheckIp');
const checkPhone = require('../../core/CheckPhone/CheckPhone');
const validateVat = require('../../core/ValidateVat/ValidateVat');
const validateIban = require('../../core/ValidateIban/ValidateIban');
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

describe('Veille connector', () => {

    it('validates the key with GET /v1/usage', async () => {
        const calls = [];
        const ok = await auth.definition.validate({ apiKey: 'test-api-key-material', httpRequest: async options => { calls.push(options); return { data: {} }; } });
        assert.equal(ok, true);
        assert.equal(calls[0].url, 'https://api.veille.io/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
    });

    it('reports a 401 as an invalid key', async () => {
        const httpRequest = async () => { const err = new Error('401'); err.response = { status: 401 }; throw err; };
        await assert.rejects(() => auth.definition.validate({ apiKey: 'bad', httpRequest }), /Invalid Veille API key/);
    });

    it('masks the key in the profile', async () => {
        const profile = await auth.definition.requestProfileInfo({ apiKey: 'abcdefgh12345678wxyz' });
        assert.equal(profile.key, 'abcdefgh...wxyz');
    });

    it('puts the API error message on the thrown error', async () => {
        const ctx = contextFor({ email: 'x' }, async () => {
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: 'Invalid query' } };
            throw err;
        });
        await assert.rejects(() => checkEmail.receive(ctx), /Veille: Invalid query/);
    });

    it('Check Email calls GET /v1/intelligence/email with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ email: 'john@example.com' }, async options => {
            calls.push(options);
            return { data: { email: 'john@mailinator.com', domain: 'mailinator.com', disposable: true, risk_score: 90 } };
        });
        await checkEmail.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.veille.io/v1/intelligence/email');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'john@example.com' });
        assert.deepEqual(ctx.output.data, { email: 'john@mailinator.com', domain: 'mailinator.com', disposable: true, risk_score: 90 });
    });
    it('Check Email cancels without Email', async () => {
        const ctx = contextFor({ email: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => checkEmail.receive(ctx), CancelError);
    });
    it('Check Domain calls GET /v1/intelligence/domain with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ domain: 'example.com' }, async options => {
            calls.push(options);
            return { data: { dns: { mx: true } } };
        });
        await checkDomain.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.veille.io/v1/intelligence/domain');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'example.com' });
        assert.deepEqual(ctx.output.data, { dns: { mx: true } });
    });
    it('Check Domain cancels without Domain', async () => {
        const ctx = contextFor({ domain: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => checkDomain.receive(ctx), CancelError);
    });
    it('Check IP Address calls GET /v1/intelligence/ip with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ ip: '8.8.8.8' }, async options => {
            calls.push(options);
            return { data: { ip: '8.8.8.8', is_tor: false } };
        });
        await checkIp.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.veille.io/v1/intelligence/ip');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: '8.8.8.8' });
        assert.deepEqual(ctx.output.data, { ip: '8.8.8.8', is_tor: false });
    });
    it('Check IP Address cancels without IP Address', async () => {
        const ctx = contextFor({ ip: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => checkIp.receive(ctx), CancelError);
    });
    it('Check Phone Number calls GET /v1/intelligence/phone with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ phone: '+33612345678' }, async options => {
            calls.push(options);
            return { data: { is_valid: true, country: 'FR' } };
        });
        await checkPhone.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.veille.io/v1/intelligence/phone');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: '+33612345678' });
        assert.deepEqual(ctx.output.data, { is_valid: true, country: 'FR' });
    });
    it('Check Phone Number cancels without Phone Number', async () => {
        const ctx = contextFor({ phone: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => checkPhone.receive(ctx), CancelError);
    });
    it('Validate VAT Number calls GET /v1/vat with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ vatNumber: 'FR40303265045' }, async options => {
            calls.push(options);
            return { data: { valid: true, vat_number: '40303265045', country_code: 'FR' } };
        });
        await validateVat.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.veille.io/v1/vat');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'FR40303265045' });
        assert.deepEqual(ctx.output.data, { valid: true, vat_number: '40303265045', country_code: 'FR' });
    });
    it('Validate VAT Number cancels without VAT Number', async () => {
        const ctx = contextFor({ vatNumber: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => validateVat.receive(ctx), CancelError);
    });
    it('Validate IBAN calls GET /v1/vat/iban with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ iban: 'FR7630006000011234567890189' }, async options => {
            calls.push(options);
            return { data: { valid: true, bic: 'AGRIFRPPXXX' } };
        });
        await validateIban.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.veille.io/v1/vat/iban');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'FR7630006000011234567890189' });
        assert.deepEqual(ctx.output.data, { valid: true, bic: 'AGRIFRPPXXX' });
    });
    it('Validate IBAN cancels without IBAN', async () => {
        const ctx = contextFor({ iban: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => validateIban.receive(ctx), CancelError);
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
        assert.equal(calls[0].url, 'https://api.veille.io/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' });
    });

    it('Make API Call sends the key only to the Veille API', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/v1/usage', method: 'GET', headers: '{"x-api-key":"evil","X-Test":"1"}' }, async options => {
            calls.push(options);
            return { status: 200, headers: {}, data: { ok: true } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].url, 'https://api.veille.io/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.equal(calls[0].headers['X-Test'], '1');
        assert.deepEqual(ctx.output.data, { statusCode: 200, headers: {}, body: { ok: true } });

        const other = contextFor({ url: 'https://evil.example.com/steal', method: 'GET' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(other), CancelError);
    });

    it('resolves relative paths on the API host', () => {
        const ctx = contextFor({}, null);
        assert.equal(lib.resolveApiUrl(ctx, 'v1/usage'), 'https://api.veille.io/v1/usage');
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://user:pass@api.veille.io/x'), CancelError);
    });
});
