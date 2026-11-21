'use strict';

const assert = require('assert');
const { Readable } = require('stream');
const lib = require('../../lib');
const MakeApiCall = require('../../MakeApiCall/MakeApiCall');
const GetObject = require('../../GetObject/GetObject');
const UploadObject = require('../../UploadObject/UploadObject');
const CopyObject = require('../../CopyObject/CopyObject');
const ComposeObjects = require('../../ComposeObjects/ComposeObjects');
const FindObjects = require('../../FindObjects/FindObjects');
const UpdateObjectMetadata = require('../../UpdateObjectMetadata/UpdateObjectMetadata');
const DownloadObject = require('../../DownloadObject/DownloadObject');
const NewOrUpdatedObject = require('../../NewOrUpdatedObject/NewOrUpdatedObject');
const NewBucket = require('../../NewBucket/NewBucket');

class CancelError extends Error {}

// httpRequest answers from `answer(options)` and records the requests.
function mockContext({ answer = () => ({ data: {} }), properties = {}, state = {}, content = {} } = {}) {

    const requests = [];
    const sent = [];
    let savedState = state;
    const context = {
        auth: { accessToken: 'token' },
        properties,
        state,
        config: {},
        componentId: 'component-1',
        CancelError,
        messages: { in: { content } },
        httpRequest: async options => {
            requests.push(options);
            return answer(options);
        },
        sendJson: async (data, port) => sent.push({ data, port }),
        saveState: async value => {
            savedState = value;
        },
        lock: async () => ({ unlock: async () => {} }),
        getFileInfo: async () => ({ filename: 'hello.txt', contentType: 'text/plain', length: 5 }),
        getFileReadStream: async () => Readable.from(['hello']),
        saveFileStream: async (filename) => ({ fileId: 'file-1', filename, length: 5 }),
        log: async () => {}
    };
    return { context, requests, sent, getState: () => savedState };
}

const object = (name, updated, generation = '1', metageneration = '1') => ({
    id: `b/${name}/${generation}`, name, bucket: 'b', generation, metageneration, updated, timeCreated: updated, size: '5'
});

// Run a tick against a fixed listing and return what fired and the new state.
async function tick(Component, state, items, properties) {

    const mock = mockContext({ answer: () => ({ data: { items } }), properties, state });
    await Component.tick(mock.context);
    return { fired: mock.sent.map(s => s.data.name || s.data.id), state: mock.getState() };
}

describe('Google Cloud Storage', () => {

    describe('lib.resolveApiUrl', () => {

        const { context } = mockContext();

        it('appends a relative path to the JSON API base URL', () => {
            assert.strictEqual(lib.resolveApiUrl(context, '/b/my-bucket/iam'), 'https://storage.googleapis.com/storage/v1/b/my-bucket/iam');
            assert.strictEqual(lib.resolveApiUrl(context, 'b'), 'https://storage.googleapis.com/storage/v1/b');
        });

        it('accepts a full URL on the API host (upload endpoint)', () => {
            const url = 'https://storage.googleapis.com/upload/storage/v1/b/x/o?uploadType=media&name=a';
            assert.strictEqual(lib.resolveApiUrl(context, url), url);
        });

        it('rejects other hosts, protocol-relative URLs and credentials', () => {
            assert.throws(() => lib.resolveApiUrl(context, 'https://evil.example/b'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, '//evil.example/b'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, 'https://storage.googleapis.com.evil.example/b'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, 'https://user:pw@storage.googleapis.com/b'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, 'http://storage.googleapis.com/b'), CancelError);
        });
    });

    describe('MakeApiCall', () => {

        it('sends the Designer key-value strings as headers and query parameters', async () => {
            const { context, requests, sent } = mockContext({
                answer: () => ({ status: 200, headers: {}, data: { items: [] } }),
                content: { url: '/b', method: 'GET', parameters: '{"project":"p-1","prefix":"e2e"}', headers: '{"X-Test":"1"}' }
            });
            await MakeApiCall.receive(context);
            assert.strictEqual(requests[0].url, 'https://storage.googleapis.com/storage/v1/b');
            assert.deepStrictEqual(requests[0].params, { project: 'p-1', prefix: 'e2e' });
            assert.strictEqual(requests[0].headers['X-Test'], '1');
            assert.strictEqual(requests[0].headers.Authorization, 'Bearer token');
            assert.deepStrictEqual(sent[0].data, { statusCode: 200, headers: {}, body: { items: [] } });
        });

        it('makes no request for a foreign host', async () => {
            const { context, requests } = mockContext({ content: { url: 'https://evil.example/x', method: 'GET' } });
            await assert.rejects(MakeApiCall.receive(context), CancelError);
            assert.strictEqual(requests.length, 0);
        });

        it('cannot override the Authorization header', async () => {
            const { context, requests } = mockContext({
                content: { url: '/b', method: 'GET', headers: '{"Authorization":"Bearer other"}' }
            });
            await MakeApiCall.receive(context);
            assert.strictEqual(requests[0].headers.Authorization, 'Bearer token');
        });
    });

    describe('object names in paths', () => {

        it('encodes the whole object name, slashes included', async () => {
            const { context, requests } = mockContext({ content: { bucket: 'b', objectName: 'reports/2026/a b#?.csv' } });
            await GetObject.receive(context);
            assert.strictEqual(requests[0].url, 'https://storage.googleapis.com/storage/v1/b/b/o/reports%2F2026%2Fa%20b%23%3F.csv');
        });

        it('rejects "." and ".." without a request', async () => {
            for (const objectName of ['.', '..']) {
                const { context, requests } = mockContext({ content: { bucket: 'b', objectName } });
                await assert.rejects(GetObject.receive(context), CancelError);
                assert.strictEqual(requests.length, 0);
            }
            const { context, requests } = mockContext({ content: { bucket: '..', objectName: 'a' } });
            await assert.rejects(GetObject.receive(context), CancelError);
            assert.strictEqual(requests.length, 0);
        });
    });

    describe('UploadObject', () => {

        it('opens a resumable session with the metadata, then sends the content to the session URL', async () => {
            const sessionUrl = 'https://storage.googleapis.com/upload/storage/v1/b/b/o?uploadType=resumable&upload_id=abc';
            const { context, requests, sent } = mockContext({
                content: { bucket: 'b', fileId: 'f-1', objectName: 'in/hello.txt' },
                answer: options => (options.method === 'POST'
                    ? { headers: { location: sessionUrl }, data: '' }
                    : { data: object('in/hello.txt', '2026-11-20T10:00:00.000Z') })
            });
            await UploadObject.receive(context);
            assert.strictEqual(requests.length, 2);
            assert.strictEqual(requests[0].url, 'https://storage.googleapis.com/upload/storage/v1/b/b/o');
            assert.deepStrictEqual(requests[0].params, { uploadType: 'resumable' });
            assert.deepStrictEqual(requests[0].data, { name: 'in/hello.txt', contentType: 'text/plain' });
            assert.strictEqual(requests[1].method, 'PUT');
            assert.strictEqual(requests[1].url, sessionUrl);
            assert.strictEqual(requests[1].headers['Content-Length'], 5);
            assert.strictEqual(sent[0].data.name, 'in/hello.txt');
        });

        it('defaults the object name to the file name', async () => {
            const { context, requests } = mockContext({
                content: { bucket: 'b', fileId: 'f-1' },
                answer: () => ({ headers: { location: 'https://storage.googleapis.com/upload/x?upload_id=1' }, data: {} })
            });
            await UploadObject.receive(context);
            assert.strictEqual(requests[0].data.name, 'hello.txt');
        });

        it('does not send the content to a session URL on another host', async () => {
            const { context, requests } = mockContext({
                content: { bucket: 'b', fileId: 'f-1', objectName: 'a' },
                answer: () => ({ headers: { location: 'https://evil.example/upload' }, data: '' })
            });
            await assert.rejects(UploadObject.receive(context), /Unexpected upload session host/);
            assert.strictEqual(requests.length, 1);
        });
    });

    describe('DownloadObject', () => {

        it('downloads the generation it read and names the file after the last part of the object name', async () => {
            const { context, requests, sent } = mockContext({
                content: { bucket: 'b', objectName: 'in/hello.txt' },
                answer: options => (options.responseType === 'stream'
                    ? { data: Readable.from(['hello']) }
                    : { data: { ...object('in/hello.txt', '2026-11-20T10:00:00.000Z', '77'), contentType: 'text/plain' } })
            });
            await DownloadObject.receive(context);
            assert.deepStrictEqual(requests[1].params, { alt: 'media', generation: '77' });
            assert.strictEqual(sent[0].data.fileName, 'hello.txt');
            assert.strictEqual(sent[0].data.fileId, 'file-1');
            assert.strictEqual(sent[0].data.object.name, 'in/hello.txt');
        });
    });

    describe('CopyObject', () => {

        it('repeats the rewrite with the token until it is done', async () => {
            let call = 0;
            const { context, requests, sent } = mockContext({
                content: { sourceBucket: 'a', sourceObject: 'x/1.txt', destinationBucket: 'b', destinationObject: 'y/1.txt' },
                answer: () => {
                    call++;
                    return call < 3
                        ? { data: { done: false, rewriteToken: `t${call}` } }
                        : { data: { done: true, resource: object('y/1.txt', '2026-11-20T10:00:00.000Z') } };
                }
            });
            await CopyObject.receive(context);
            assert.strictEqual(requests.length, 3);
            assert.strictEqual(requests[0].url, 'https://storage.googleapis.com/storage/v1/b/a/o/x%2F1.txt/rewriteTo/b/b/o/y%2F1.txt');
            assert.strictEqual(requests[0].params, undefined);
            assert.deepStrictEqual(requests[2].params, { rewriteToken: 't2' });
            assert.strictEqual(sent[0].data.name, 'y/1.txt');
        });

        it('refuses to copy an object onto itself', async () => {
            const { context, requests } = mockContext({ content: { sourceBucket: 'a', sourceObject: 'x' } });
            await assert.rejects(CopyObject.receive(context), CancelError);
            assert.strictEqual(requests.length, 0);
        });
    });

    describe('ComposeObjects', () => {

        it('sends the source objects in order', async () => {
            const { context, requests } = mockContext({
                content: { bucket: 'b', sourceObjects: 'part-1, part-2', destinationObject: 'all.txt', contentType: 'text/plain' }
            });
            await ComposeObjects.receive(context);
            assert.strictEqual(requests[0].url, 'https://storage.googleapis.com/storage/v1/b/b/o/all.txt/compose');
            assert.deepStrictEqual(requests[0].data, {
                sourceObjects: [{ name: 'part-1' }, { name: 'part-2' }],
                destination: { contentType: 'text/plain' }
            });
        });

        it('rejects more than 32 sources', async () => {
            const names = Array.from({ length: 33 }, (v, i) => `p${i}`);
            const { context, requests } = mockContext({ content: { bucket: 'b', sourceObjects: names, destinationObject: 'all' } });
            await assert.rejects(ComposeObjects.receive(context), CancelError);
            assert.strictEqual(requests.length, 0);
        });
    });

    describe('FindObjects', () => {

        it('sends notFound for no match', async () => {
            const { context, sent, requests } = mockContext({ content: { bucket: 'b', prefix: 'none/', outputType: 'array' } });
            await FindObjects.receive(context);
            assert.deepStrictEqual(requests[0].params, { maxResults: 1000, prefix: 'none/' });
            assert.deepStrictEqual(sent, [{ data: {}, port: 'notFound' }]);
        });

        it('emits the first match with outputType first', async () => {
            const { context, sent } = mockContext({
                content: { bucket: 'b', matchGlob: '**/*.txt', outputType: 'first' },
                answer: () => ({ data: { items: [object('a.txt', '2026-11-20T10:00:00.000Z'), object('b.txt', '2026-11-20T10:00:00.000Z')] } })
            });
            await FindObjects.receive(context);
            assert.strictEqual(sent[0].data.name, 'a.txt');
            assert.strictEqual(sent[0].data.count, 2);
        });
    });

    describe('UpdateObjectMetadata', () => {

        it('patches only the fields that are filled in', async () => {
            const { context, requests, sent } = mockContext({
                content: { bucket: 'b', objectName: 'a.txt', cacheControl: 'no-cache', contentType: '', metadata: '{"team": "ops", "n": 1}' }
            });
            await UpdateObjectMetadata.receive(context);
            assert.strictEqual(requests[0].method, 'PATCH');
            assert.deepStrictEqual(requests[0].data, { cacheControl: 'no-cache', metadata: { team: 'ops', n: '1' } });
            assert.deepStrictEqual(sent[0].data, {});
        });

        it('rejects an update with nothing to change', async () => {
            const { context, requests } = mockContext({ content: { bucket: 'b', objectName: 'a.txt' } });
            await assert.rejects(UpdateObjectMetadata.receive(context), CancelError);
            assert.strictEqual(requests.length, 0);
        });
    });

    describe('NewOrUpdatedObject', () => {

        const T1 = '2026-11-20T10:00:00.000Z';
        const T2 = '2026-11-20T10:05:00.000Z';
        const props = { bucket: 'b' };

        it('records a baseline on the first tick and fires nothing', async () => {
            const { fired, state } = await tick(NewOrUpdatedObject, {}, [object('a', T1)], props);
            assert.deepStrictEqual(fired, []);
            assert.deepStrictEqual(state, { initialized: true, since: T1, atSince: ['a#1#1'] });
        });

        it('fires new, overwritten and metadata-updated objects, oldest first', async () => {
            const base = (await tick(NewOrUpdatedObject, {}, [object('a', T1), object('b', T1)], props)).state;
            const { fired } = await tick(NewOrUpdatedObject, base, [
                object('a', T2, '1', '2'),          // metadata update
                object('b', T1),                     // unchanged
                object('c', '2026-11-20T10:01:00.000Z') // new
            ], props);
            assert.deepStrictEqual(fired, ['c', 'a']);
        });

        it('fires an object written in the same millisecond as the last one seen, once', async () => {
            const base = (await tick(NewOrUpdatedObject, {}, [object('a', T1)], props)).state;
            const second = await tick(NewOrUpdatedObject, base, [object('a', T1), object('b', T1)], props);
            assert.deepStrictEqual(second.fired, ['b']);
            const third = await tick(NewOrUpdatedObject, second.state, [object('a', T1), object('b', T1)], props);
            assert.deepStrictEqual(third.fired, []);
        });

        it('fires every object that appears in a bucket that was empty at start', async () => {
            const base = (await tick(NewOrUpdatedObject, {}, [], props)).state;
            assert.deepStrictEqual(base, { initialized: true, since: null, atSince: [] });
            const { fired } = await tick(NewOrUpdatedObject, base, [object('a', T1)], props);
            assert.deepStrictEqual(fired, ['a']);
        });

        it('keeps the high-water mark when the bucket is emptied', async () => {
            const base = (await tick(NewOrUpdatedObject, {}, [object('a', T1)], props)).state;
            const empty = await tick(NewOrUpdatedObject, base, [], props);
            assert.deepStrictEqual(empty.fired, []);
            assert.strictEqual(empty.state.since, T1);
            const again = await tick(NewOrUpdatedObject, empty.state, [object('a', T1)], props);
            assert.deepStrictEqual(again.fired, []);
        });

        it('reads every page and passes the prefix', async () => {
            const { context, requests } = mockContext({
                properties: { bucket: 'b', prefix: 'in/' },
                answer: options => (options.params.pageToken
                    ? { data: { items: [object('in/2', T2)] } }
                    : { data: { items: [object('in/1', T1)], nextPageToken: 'p2' } })
            });
            await NewOrUpdatedObject.tick(context);
            assert.strictEqual(requests.length, 2);
            assert.deepStrictEqual(requests[0].params, { prefix: 'in/', maxResults: 1000 });
            assert.deepStrictEqual(requests[1].params, { prefix: 'in/', maxResults: 1000, pageToken: 'p2' });
        });

        it('test() emits the most recently updated object without saving state', async () => {
            const mock = mockContext({
                properties: props,
                answer: () => ({ data: { items: [object('a', T2), object('b', T1)] } })
            });
            await NewOrUpdatedObject.test(mock.context);
            assert.strictEqual(mock.sent[0].data.name, 'a');
            assert.deepStrictEqual(mock.getState(), {});
        });
    });

    describe('NewBucket', () => {

        const bucket = (id, timeCreated = '2026-11-20T10:00:00.000Z') => ({ id, name: id, timeCreated });
        const props = { projectId: 'p-1' };

        it('records a baseline, then fires new buckets', async () => {
            const base = await tick(NewBucket, {}, [bucket('a')], props);
            assert.deepStrictEqual(base.fired, []);
            const next = await tick(NewBucket, base.state, [bucket('a'), bucket('b')], props);
            assert.deepStrictEqual(next.fired, ['b']);
        });

        it('keeps the state when the answer is empty', async () => {
            const base = await tick(NewBucket, {}, [bucket('a')], props);
            const empty = await tick(NewBucket, base.state, [], props);
            assert.deepStrictEqual(empty.state, base.state);
            const again = await tick(NewBucket, empty.state, [bucket('a')], props);
            assert.deepStrictEqual(again.fired, []);
        });

        it('lists the buckets of the project', async () => {
            const { context, requests } = mockContext({ properties: props, answer: () => ({ data: { items: [] } }) });
            await NewBucket.tick(context);
            assert.strictEqual(requests[0].url, 'https://storage.googleapis.com/storage/v1/b');
            assert.deepStrictEqual(requests[0].params, { project: 'p-1', maxResults: 1000 });
        });
    });
});
