'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const ListSourceHubsWithoutPostData = require(path.join(
    __dirname, '../../src/appmixer/hubbi/core/ListSourceHubsWithoutPostData/ListSourceHubsWithoutPostData.js'
));

describe('Hubbi ListSourceHubsWithoutPostData', function() {

    let context;
    beforeEach(function() {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl', clientKey: 'ck-1', token: 'jwt' };
        context.properties = {};
        context.messages = { in: { content: { outputType: 'array' } } };
    });

    it('generates output port options without an HTTP call', async function() {
        context.properties.generateOutputPortOptions = true;
        await ListSourceHubsWithoutPostData.receive(context);
        assert(context.httpRequest.notCalled);
        assert(context.sendJson.calledOnce);
    });

    it('calls the ListSourceHubsWithoutPostData endpoint and returns { result, count }', async function() {
        const hubs = [{ key: 'k1', name: 'Hub 1' }];
        context.httpRequest.resolves({ data: hubs });

        await ListSourceHubsWithoutPostData.receive(context);

        const req = context.httpRequest.firstCall.args[0];
        assert.strictEqual(
            req.url,
            'https://test.hubbi.nl/Flows/Home/ListSourceHubsWithoutPostData?clientKey=ck-1'
        );
        assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: hubs, count: 1 });
    });

    it('toSelectArray maps hubs to label/value pairs', function() {
        const out = ListSourceHubsWithoutPostData.toSelectArray([{ key: 'k', name: 'N' }]);
        assert.deepStrictEqual(out, [{ label: 'N', value: 'k' }]);
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

            await ListSourceHubsWithoutPostData.receive(context);
            await ListSourceHubsWithoutPostData.receive(context);
            await ListSourceHubsWithoutPostData.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 1, 'burst must collapse to one call');
            assert(context.staticCache.set.calledOnce);
            assert.deepStrictEqual(context.sendJson.lastCall.args[0], { result: HUBS, count: 1 });
        });

        it('takes a lock around the fetch so a cold cache does not stampede', async function() {
            context.properties.isSource = true;
            await ListSourceHubsWithoutPostData.receive(context);
            assert(context.lock.calledOnce);
            assert.strictEqual(context.lock.firstCall.args[0], context.staticCache.set.firstCall.args[0]);
        });

        it('keys the cache on the account, not just the URL', async function() {
            context.properties.isSource = true;
            await ListSourceHubsWithoutPostData.receive(context);
            const firstKey = context.staticCache.set.firstCall.args[0];

            context.staticCache.set.resetHistory();
            context.auth = { ...context.auth, token: 'other-jwt' };
            await ListSourceHubsWithoutPostData.receive(context);

            assert.notStrictEqual(context.staticCache.set.firstCall.args[0], firstKey);
        });

        it('honors the configured cache TTL', async function() {
            context.properties.isSource = true;
            context.config = { listCacheTTL: 5000 };
            await ListSourceHubsWithoutPostData.receive(context);
            assert.strictEqual(context.staticCache.set.firstCall.args[2], 5000);
        });

        it('answers a failed dropdown with an empty list instead of an error', async function() {
            context.properties.isSource = true;
            context.httpRequest.rejects(new Error('502 Bad Gateway'));

            await assert.doesNotReject(() => ListSourceHubsWithoutPostData.receive(context));

            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [], count: 0 });
            assert.strictEqual(context.log.firstCall.args[0].error, '502 Bad Gateway');
        });

        it('still fails a flow run loudly', async function() {
            context.httpRequest.rejects(new Error('502 Bad Gateway'));

            await assert.rejects(() => ListSourceHubsWithoutPostData.receive(context), /502 Bad Gateway/);
            assert(context.sendJson.notCalled);
        });

        it('does not cache a flow run', async function() {
            await ListSourceHubsWithoutPostData.receive(context);
            await ListSourceHubsWithoutPostData.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 2, 'live runs must not be cached');
            assert(context.staticCache.set.notCalled);
            assert(context.lock.notCalled);
        });
    });
});
