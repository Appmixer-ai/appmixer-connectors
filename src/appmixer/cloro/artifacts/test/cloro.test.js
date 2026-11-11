'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const findGoogleResults = require('../../core/FindGoogleResults/FindGoogleResults');
const getAIAnswer = require('../../core/GetAIAnswer/GetAIAnswer');
const getCredits = require('../../core/GetCredits/GetCredits');
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

const GOOGLE_RESPONSE = {
    success: true,
    result: {
        organicResults: [
            { position: 1, title: 'First', link: 'https://example.com/a', displayedLink: 'example.com', snippet: 'A.' },
            { position: 2, title: 'Unresolved', link: '', snippet: 'No link yet.' },
            { position: 3, title: 'Second', link: 'https://example.org/b', snippet: 'B.', date: '2 days ago' }
        ]
    }
};

const ANSWER_RESPONSE = {
    success: true,
    result: {
        text: 'Plain answer.',
        markdown: '**Answer.**',
        sources: [
            { position: 1, label: 'Source', url: 'https://example.com', description: 'Desc.', redirectLink: 'x' }
        ]
    }
};

describe('cloro connector', function() {

    it('validates the key with GET /v1/credits and masks it in the profile', async function() {

        let request;
        const context = {
            apiKey: 'sk_live_secret_material_1234',
            httpRequest: async (value) => {
                request = value;
                return { data: { remaining: 10 } };
            }
        };

        assert.strictEqual(await auth.definition.validate(context), true);
        assert.strictEqual(request.method, 'GET');
        assert.strictEqual(request.url, 'https://api.cloro.dev/v1/credits');
        assert.strictEqual(request.headers.Authorization, 'Bearer sk_live_secret_material_1234');

        const profile = await auth.definition.requestProfileInfo(context);
        assert(!profile.key.includes('secret_material'));
        assert.strictEqual(profile.key, 'sk_live_...1234');
    });

    it('reports a 401 as an invalid key and keeps other errors', async function() {

        const unauthorized = { apiKey: 'bad', httpRequest: async () => {
            const err = new Error('Request failed with status code 401');
            err.response = { status: 401 };
            throw err;
        } };
        await assert.rejects(auth.definition.validate(unauthorized), /Invalid cloro API key/);

        const outage = { apiKey: 'key', httpRequest: async () => {
            const err = new Error('Request failed with status code 503');
            err.response = { status: 503 };
            throw err;
        } };
        await assert.rejects(auth.definition.validate(outage), /503/);
    });

    it('searches Google with the query and country and skips unresolved links', async function() {

        let request;
        const context = contextFor({ query: 'search engine results page', country: 'de', outputType: 'array' }, async (value) => {
            request = value;
            return { data: GOOGLE_RESPONSE };
        });

        await findGoogleResults.receive(context);

        assert.strictEqual(request.method, 'POST');
        assert.strictEqual(request.url, 'https://api.cloro.dev/v1/monitor/google');
        assert.deepStrictEqual(request.data, { query: 'search engine results page', country: 'DE' });
        assert.strictEqual(request.headers.Authorization, 'Bearer test-api-key-material');
        assert.strictEqual(context.output.port, 'out');
        assert.strictEqual(context.output.data.count, 2);
        assert.deepStrictEqual(context.output.data.result.map(row => row.link), [
            'https://example.com/a',
            'https://example.org/b'
        ]);
    });

    it('sends the query to notFound when there are no results', async function() {

        const context = contextFor({ query: 'nothing' }, async () => ({
            data: { success: true, result: { organicResults: [] } }
        }));

        await findGoogleResults.receive(context);

        assert.strictEqual(context.output.port, 'notFound');
        assert.deepStrictEqual(context.output.data, { query: 'nothing' });
    });

    it('emits one message per result for the object output type', async function() {

        const context = contextFor({ query: 'q', outputType: 'object' }, async () => ({ data: GOOGLE_RESPONSE }));

        await findGoogleResults.receive(context);

        assert.strictEqual(context.output.sent.length, 2);
        assert.strictEqual(context.output.sent[1].data.index, 1);
        assert.strictEqual(context.output.sent[1].data.count, 2);
    });

    for (const [engine, path] of [
        ['aimode', '/v1/monitor/aimode'],
        ['bing_aimode', '/v1/monitor/bing/aimode'],
        ['chatgpt', '/v1/monitor/chatgpt'],
        ['gemini', '/v1/monitor/gemini']
    ]) {
        it(`gets the ${engine} answer with its sources`, async function() {

            let request;
            const context = contextFor({ engine, prompt: 'What is a search engine results page?' }, async (value) => {
                request = value;
                return { data: ANSWER_RESPONSE };
            });

            await getAIAnswer.receive(context);

            assert.strictEqual(request.url, `https://api.cloro.dev${path}`);
            assert.strictEqual(request.timeout, 120000);
            assert.deepStrictEqual(request.data, {
                prompt: 'What is a search engine results page?',
                country: 'US',
                include: { markdown: true }
            });
            assert.deepStrictEqual(context.output.data, {
                engine,
                prompt: 'What is a search engine results page?',
                text: 'Plain answer.',
                markdown: '**Answer.**',
                sources: [{ position: 1, label: 'Source', url: 'https://example.com', description: 'Desc.' }]
            });
        });
    }

    it('rejects a Bing AI Mode prompt that is too long after URL encoding', async function() {

        let called = false;
        // 600 CJK characters are 5,400 characters once URL-encoded.
        const context = contextFor({ engine: 'bing_aimode', prompt: '中'.repeat(600) }, async () => {
            called = true;
            return { data: ANSWER_RESPONSE };
        });

        await assert.rejects(getAIAnswer.receive(context), /too long for Bing AI Mode/);
        assert.strictEqual(called, false);
        assert.strictEqual(lib.encodedPromptLength('a b'), 3);
    });

    it('puts the cloro error message on a failed request', async function() {

        const context = contextFor({ engine: 'gemini', prompt: 'hi' }, async () => {
            const err = new Error('Request failed with status code 402');
            err.response = {
                status: 402,
                data: { success: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' } }
            };
            throw err;
        });

        await assert.rejects(getAIAnswer.receive(context), /cloro: INSUFFICIENT_CREDITS: Not enough credits/);
    });

    it('reads the credit balance', async function() {

        let request;
        const context = contextFor({}, async (value) => {
            request = value;
            return { data: { remaining: 12500, perCycle: 25000, cycleResetsAt: '2026-12-01T00:00:00.000Z' } };
        });

        await getCredits.receive(context);

        assert.strictEqual(request.method, 'GET');
        assert.strictEqual(request.url, 'https://api.cloro.dev/v1/credits');
        assert.deepStrictEqual(context.output.data, {
            remaining: 12500,
            perCycle: 25000,
            cycleResetsAt: '2026-12-01T00:00:00.000Z'
        });
    });

    it('refuses API calls to another host so the key is not sent elsewhere', async function() {

        const context = contextFor({ url: 'https://example.com/steal', method: 'GET' }, async () => {
            throw new Error('must not be called');
        });

        await assert.rejects(makeApiCall.receive(context), /must target https:\/\/api\.cloro\.dev/);
    });

    it('makes an authorized API call to a relative path', async function() {

        let request;
        const context = contextFor({ url: '/v1/countries', method: 'GET' }, async (value) => {
            request = value;
            return { status: 200, headers: {}, data: [{ code: 'US' }] };
        });

        await makeApiCall.receive(context);

        assert.strictEqual(request.url, 'https://api.cloro.dev/v1/countries');
        assert.strictEqual(request.headers.Authorization, 'Bearer test-api-key-material');
        assert.strictEqual(context.output.data.statusCode, 200);
    });

    it('drops a user Authorization header whatever its case', async function() {

        let request;
        const headers = JSON.stringify({ authorization: 'Bearer other', AUTHORIZATION: 'x', Accept: 'application/json' });
        const context = contextFor({ url: '/v1/countries', method: 'GET', headers }, async (value) => {
            request = value;
            return { status: 200, headers: {}, data: [] };
        });

        await makeApiCall.receive(context);

        assert.deepStrictEqual(request.headers, {
            Accept: 'application/json',
            Authorization: 'Bearer test-api-key-material'
        });
    });

    it('cancels, without a retry, when the headers are not a JSON object', async function() {

        const context = contextFor({ url: '/v1/countries', method: 'GET', headers: '{not json' }, async () => {
            throw new Error('must not be called');
        });

        await assert.rejects(makeApiCall.receive(context), CancelError);
    });
});
