'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const MakeApiCall = require(path.join(__dirname, '../../src/appmixer/hubbi/core/MakeApiCall/MakeApiCall.js'));

// The key-value inputs (parameters, headers) cannot be exercised through
// `appmixer test component`: the standard declares their JSON Schema type as
// "string" while the inspector produces an array, and the CLI's port validation
// rejects the array. Every MakeApiCall in the repo behaves this way - the same
// input fails identically on the reference implementation - so those paths are
// covered here instead.
describe('Hubbi MakeApiCall', function() {

    let context;
    beforeEach(function() {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl/', clientKey: 'ck-1', token: 'jwt' };
        context.messages = { in: { content: { url: '/Flows/Home/ListTargetHubs', method: 'GET' } } };
        context.httpRequest.resolves({ status: 200, headers: { 'content-type': 'application/json' }, data: [{ key: 'k1' }] });
    });

    describe('required inputs', function() {

        it('throws CancelError when the path is missing', async function() {
            context.messages.in.content.url = undefined;
            await assert.rejects(
                () => MakeApiCall.receive(context),
                e => e.name === 'CancelError' && /API Endpoint Path is required/.test(e.message)
            );
        });

        it('throws CancelError when the method is missing', async function() {
            context.messages.in.content.method = undefined;
            await assert.rejects(
                () => MakeApiCall.receive(context),
                e => e.name === 'CancelError' && /HTTP Method is required/.test(e.message)
            );
        });
    });

    describe('URL building', function() {

        it('resolves a path against the account base URL and strips its trailing slash', async function() {
            await MakeApiCall.receive(context);
            assert.strictEqual(
                context.httpRequest.firstCall.args[0].url,
                'https://test.hubbi.nl/Flows/Home/ListTargetHubs'
            );
        });

        it('accepts a path without a leading slash', async function() {
            context.messages.in.content.url = 'Flows/Home/ListTargetHubs';
            await MakeApiCall.receive(context);
            assert.strictEqual(
                context.httpRequest.firstCall.args[0].url,
                'https://test.hubbi.nl/Flows/Home/ListTargetHubs'
            );
        });

        it('passes a full URL through untouched', async function() {
            context.messages.in.content.url = 'https://other.hubbi.nl/Some/Path';
            await MakeApiCall.receive(context);
            assert.strictEqual(context.httpRequest.firstCall.args[0].url, 'https://other.hubbi.nl/Some/Path');
        });
    });

    describe('auth and query parameters', function() {

        it('sets the bearer token without the caller having to', async function() {
            await MakeApiCall.receive(context);
            assert.strictEqual(context.httpRequest.firstCall.args[0].headers.Authorization, 'Bearer jwt');
        });

        it('fills in the clientKey of the connected account', async function() {
            await MakeApiCall.receive(context);
            assert.deepStrictEqual(context.httpRequest.firstCall.args[0].params, { clientKey: 'ck-1' });
        });

        it('merges key-value parameters on top of it', async function() {
            context.messages.in.content.parameters = [{ key: 'conversionKey', value: 'cv-9' }];
            await MakeApiCall.receive(context);
            assert.deepStrictEqual(
                context.httpRequest.firstCall.args[0].params,
                { clientKey: 'ck-1', conversionKey: 'cv-9' }
            );
        });

        it('lets an explicit clientKey win, so another client can be targeted', async function() {
            context.messages.in.content.parameters = [{ key: 'clientKey', value: 'other-client' }];
            await MakeApiCall.receive(context);
            assert.strictEqual(context.httpRequest.firstCall.args[0].params.clientKey, 'other-client');
        });

        it('ignores parameter rows with no key', async function() {
            context.messages.in.content.parameters = [{ key: '', value: 'x' }, { value: 'y' }];
            await MakeApiCall.receive(context);
            assert.deepStrictEqual(context.httpRequest.firstCall.args[0].params, { clientKey: 'ck-1' });
        });

        it('adds key-value headers alongside the generated ones', async function() {
            context.messages.in.content.headers = [{ key: 'X-Trace', value: 'abc' }];
            await MakeApiCall.receive(context);
            const headers = context.httpRequest.firstCall.args[0].headers;
            assert.strictEqual(headers['X-Trace'], 'abc');
            assert.strictEqual(headers.Authorization, 'Bearer jwt');
        });
    });

    describe('request body', function() {

        it('sends no body and no content-type when none is given', async function() {
            await MakeApiCall.receive(context);
            const req = context.httpRequest.firstCall.args[0];
            assert.strictEqual(req.data, undefined);
            assert.strictEqual(req.headers['Content-Type'], undefined);
        });

        it('parses a JSON string body and sets the content type', async function() {
            context.messages.in.content.method = 'POST';
            context.messages.in.content.body = '{"a":1,"b":[2,3]}';
            await MakeApiCall.receive(context);
            const req = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(req.data, { a: 1, b: [2, 3] });
            assert.strictEqual(req.headers['Content-Type'], 'application/json');
        });

        it('accepts a body that is already an object', async function() {
            context.messages.in.content.method = 'POST';
            context.messages.in.content.body = { a: 1 };
            await MakeApiCall.receive(context);
            assert.deepStrictEqual(context.httpRequest.firstCall.args[0].data, { a: 1 });
        });

        it('throws CancelError on malformed JSON instead of sending it', async function() {
            context.messages.in.content.method = 'POST';
            context.messages.in.content.body = '{not json';
            await assert.rejects(
                () => MakeApiCall.receive(context),
                e => e.name === 'CancelError' && /must be valid JSON/.test(e.message)
            );
            assert(context.httpRequest.notCalled);
        });
    });

    describe('output and errors', function() {

        it('returns status, headers and body', async function() {
            await MakeApiCall.receive(context);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], {
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
                body: [{ key: 'k1' }]
            });
            assert.strictEqual(context.sendJson.firstCall.args[1], 'out');
        });

        it('reclassifies HTTP 409 as retryable, like the other actions', async function() {
            const err = new Error('conflict');
            err.response = { status: 409 };
            context.httpRequest.rejects(err);
            await assert.rejects(
                () => MakeApiCall.receive(context),
                e => e.name !== 'CancelError' && /HubBI conflict/.test(e.message)
            );
        });

        it('reclassifies HTTP 423 as a CancelError', async function() {
            const err = new Error('locked');
            err.response = { status: 423 };
            context.httpRequest.rejects(err);
            await assert.rejects(
                () => MakeApiCall.receive(context),
                e => e.name === 'CancelError' && /resource locked/.test(e.message)
            );
        });
    });
});
