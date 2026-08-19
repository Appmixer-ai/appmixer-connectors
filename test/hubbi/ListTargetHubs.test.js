'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const ListTargetHubs = require(path.join(__dirname, '../../src/appmixer/hubbi/core/ListTargetHubs/ListTargetHubs.js'));

describe('Hubbi ListTargetHubs', function() {

    let context;
    beforeEach(function() {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl/', clientKey: 'client key/1', token: 'jwt' };
        context.properties = {};
        context.messages = { in: { content: { outputType: 'array' } } };
    });

    it('generates output port options without an HTTP call', async function() {
        context.properties.generateOutputPortOptions = true;
        await ListTargetHubs.receive(context);
        assert(context.httpRequest.notCalled, 'should not hit the API');
        assert(context.sendJson.calledOnce);
    });

    it('calls the ListTargetHubs endpoint and returns { result, count }', async function() {
        const hubs = [{ key: 'k1', name: 'Hub 1' }, { key: 'k2', name: 'Hub 2' }];
        context.httpRequest.resolves({ data: hubs });

        await ListTargetHubs.receive(context);

        const req = context.httpRequest.firstCall.args[0];
        assert.strictEqual(req.method, 'GET');
        // base URL trailing slash is stripped and clientKey is URL-encoded
        assert.strictEqual(
            req.url,
            'https://test.hubbi.nl/Flows/Home/ListTargetHubs?clientKey=client%20key%2F1'
        );
        assert.strictEqual(req.headers.Authorization, 'Bearer jwt');
        assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: hubs, count: 2 });
    });

    it('handles an empty/missing response body', async function() {
        context.httpRequest.resolves({});
        await ListTargetHubs.receive(context);
        assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [], count: 0 });
    });

    describe('toSelectArray', function() {
        it('maps a { result } payload to label/value pairs', function() {
            const out = ListTargetHubs.toSelectArray({ result: [{ key: 'k', name: 'N' }] });
            assert.deepStrictEqual(out, [{ label: 'N', value: 'k' }]);
        });
        it('maps a bare array payload to label/value pairs', function() {
            const out = ListTargetHubs.toSelectArray([{ key: 'k', name: 'N' }]);
            assert.deepStrictEqual(out, [{ label: 'N', value: 'k' }]);
        });
        it('returns an empty array for an unexpected payload', function() {
            assert.deepStrictEqual(ListTargetHubs.toSelectArray({}), []);
        });
    });
    // Inspector dropdowns are resolved with isSource, and the designer fires
    // them in a concurrent burst whenever an inspector opens. Those calls are
    // cached; a flow run (no sentinel) must still get the live list.
    describe('dynamic source calls', function() {

        const HUBS = [{ key: 'k1', name: 'Hub 1' }];

        beforeEach(function() {
            global.serviceState = {};
            context.httpRequest.resolves({ data: HUBS });
            // Short TTL so the cache mock does not leave a 2-minute timer armed.
            context.config = { listCacheTTL: 2000 };
        });

        it('hits the API once and serves the burst from cache', async function() {
            context.properties.isSource = true;

            await ListTargetHubs.receive(context);
            await ListTargetHubs.receive(context);
            await ListTargetHubs.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1, 'burst must collapse to one call');
            assert(context.staticCache.set.calledOnce);
            assert.deepStrictEqual(context.sendJson.lastCall.args[0], { result: HUBS, count: 1 });
        });

        it('takes a lock around the fetch so a cold cache does not stampede', async function() {
            context.properties.isSource = true;
            await ListTargetHubs.receive(context);
            assert(context.lock.calledOnce);
            assert.strictEqual(context.lock.firstCall.args[0], context.staticCache.set.firstCall.args[0]);
        });

        it('keys the cache on the account, not just the URL', async function() {
            context.properties.isSource = true;
            await ListTargetHubs.receive(context);
            const firstKey = context.staticCache.set.firstCall.args[0];

            context.staticCache.set.resetHistory();
            context.auth = { ...context.auth, token: 'other-jwt' };
            await ListTargetHubs.receive(context);

            assert.notStrictEqual(context.staticCache.set.firstCall.args[0], firstKey);
        });

        it('honors the configured cache TTL', async function() {
            context.properties.isSource = true;
            context.config = { listCacheTTL: 5000 };
            await ListTargetHubs.receive(context);
            assert.strictEqual(context.staticCache.set.firstCall.args[2], 5000);
        });

        it('answers a failed dropdown with an empty list instead of an error', async function() {
            context.properties.isSource = true;
            context.httpRequest.rejects(new Error('502 Bad Gateway'));

            await assert.doesNotReject(() => ListTargetHubs.receive(context));

            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [], count: 0 });
            assert.strictEqual(context.log.firstCall.args[0].error, '502 Bad Gateway');
        });

        it('still fails a flow run loudly', async function() {
            context.httpRequest.rejects(new Error('502 Bad Gateway'));

            await assert.rejects(() => ListTargetHubs.receive(context), /502 Bad Gateway/);
            assert(context.sendJson.notCalled);
        });

        it('does not cache a flow run', async function() {
            await ListTargetHubs.receive(context);
            await ListTargetHubs.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 2, 'live runs must not be cached');
            assert(context.staticCache.set.notCalled);
            assert(context.lock.notCalled);
        });
    });
});
