'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const getMediaMetadata = require('../../core/GetMediaMetadata/GetMediaMetadata');
const startVideoDownload = require('../../core/StartVideoDownload/StartVideoDownload');
const startAudioDownload = require('../../core/StartAudioDownload/StartAudioDownload');
const getDownloadJob = require('../../core/GetDownloadJob/GetDownloadJob');
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

describe('HuntAPI connector', () => {

    it('validates the key with GET /v1/usage', async () => {
        const calls = [];
        const ok = await auth.definition.validate({ apiKey: 'test-api-key-material', httpRequest: async options => { calls.push(options); return { data: {} }; } });
        assert.equal(ok, true);
        assert.equal(calls[0].url, 'https://api.huntapi.com/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
    });

    it('reports a 401 as an invalid key', async () => {
        const httpRequest = async () => { const err = new Error('401'); err.response = { status: 401 }; throw err; };
        await assert.rejects(() => auth.definition.validate({ apiKey: 'bad', httpRequest }), /Invalid HuntAPI API key/);
    });

    it('masks the key in the profile', async () => {
        const profile = await auth.definition.requestProfileInfo({ apiKey: 'abcdefgh12345678wxyz' });
        assert.equal(profile.key, 'abcdefgh...wxyz');
    });

    it('puts the API error message on the thrown error', async () => {
        const ctx = contextFor({ url: 'x' }, async () => {
            const err = new Error('Request failed');
            err.response = { status: 400, data: { error: 'Invalid query' } };
            throw err;
        });
        await assert.rejects(() => getMediaMetadata.receive(ctx), /HuntAPI: Invalid query/);
    });

    it('Get Media Metadata calls GET /v1/media/metadata with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ url: 'https://example.com' }, async options => {
            calls.push(options);
            return { data: { metadata: { id: 'jNQXAC9IVRw', title: 'Me at the zoo', duration: 19 } } };
        });
        await getMediaMetadata.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.huntapi.com/v1/media/metadata');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'https://example.com' });
        assert.deepEqual(ctx.output.data, { metadata: { id: 'jNQXAC9IVRw', title: 'Me at the zoo', duration: 19 } });
    });
    it('Get Media Metadata cancels without Media URL', async () => {
        const ctx = contextFor({ url: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => getMediaMetadata.receive(ctx), CancelError);
    });
    it('Start Video Download calls GET /v1/video/download with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ url: 'https://example.com', videoQuality: 'value', videoFormat: 'value' }, async options => {
            calls.push(options);
            return { data: { job_id: 'job-1' } };
        });
        await startVideoDownload.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.huntapi.com/v1/video/download');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'https://example.com', video_quality: 'value', video_format: 'value' });
        assert.deepEqual(ctx.output.data, { job_id: 'job-1' });
    });
    it('Start Video Download cancels without Video URL', async () => {
        const ctx = contextFor({ url: '', videoQuality: 'value', videoFormat: 'value' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => startVideoDownload.receive(ctx), CancelError);
    });
    it('Start Audio Download calls GET /v1/audio/download with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ url: 'https://example.com', audioFormat: 'value' }, async options => {
            calls.push(options);
            return { data: { job_id: 'job-2' } };
        });
        await startAudioDownload.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.huntapi.com/v1/audio/download');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, { query: 'https://example.com', audio_format: 'value' });
        assert.deepEqual(ctx.output.data, { job_id: 'job-2' });
    });
    it('Start Audio Download cancels without Media URL', async () => {
        const ctx = contextFor({ url: '', audioFormat: 'value' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => startAudioDownload.receive(ctx), CancelError);
    });
    it('Get Download Job calls GET /v1/jobs/{jobId} with the key and sends the result', async () => {
        const calls = [];
        const ctx = contextFor({ jobId: 'job-1' }, async options => {
            calls.push(options);
            return { data: { id: 'job-1', status: 'Running', progress: 40 } };
        });
        await getDownloadJob.receive(ctx);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].method, 'GET');
        assert.equal(calls[0].url, 'https://api.huntapi.com/v1/jobs/job-1');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { id: 'job-1', status: 'Running', progress: 40 });
    });
    it('Get Download Job cancels without Job ID', async () => {
        const ctx = contextFor({ jobId: '' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => getDownloadJob.receive(ctx), CancelError);
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
        assert.equal(calls[0].url, 'https://api.huntapi.com/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.deepEqual(calls[0].params, {});
        assert.deepEqual(ctx.output.data, { remaining: 48500, total_used: 1500, renewal_date: '2026-12-01' });
    });

    it('Make API Call sends the key only to the HuntAPI API', async () => {
        const calls = [];
        const ctx = contextFor({ url: '/v1/usage', method: 'GET', headers: '{"x-api-key":"evil","X-Test":"1"}' }, async options => {
            calls.push(options);
            return { status: 200, headers: {}, data: { ok: true } };
        });
        await makeApiCall.receive(ctx);
        assert.equal(calls[0].url, 'https://api.huntapi.com/v1/usage');
        assert.equal(calls[0].headers['x-api-key'], 'test-api-key-material');
        assert.equal(calls[0].headers['X-Test'], '1');
        assert.deepEqual(ctx.output.data, { statusCode: 200, headers: {}, body: { ok: true } });

        const other = contextFor({ url: 'https://evil.example.com/steal', method: 'GET' }, async () => { throw new Error('no request expected'); });
        await assert.rejects(() => makeApiCall.receive(other), CancelError);
    });

    it('resolves relative paths on the API host', () => {
        const ctx = contextFor({}, null);
        assert.equal(lib.resolveApiUrl(ctx, 'v1/usage'), 'https://api.huntapi.com/v1/usage');
        assert.throws(() => lib.resolveApiUrl(ctx, 'https://user:pass@api.huntapi.com/x'), CancelError);
    });
});
