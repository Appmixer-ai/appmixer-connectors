'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const ListTargetHubs = require(path.join(__dirname, '../../src/appmixer/hubbi/core/ListTargetHubs/ListTargetHubs.js'));

describe('Hubbi ListTargetHubs', function () {

    let context;
    beforeEach(function () {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl/', clientKey: 'client key/1', token: 'jwt' };
        context.properties = {};
        context.messages = { in: { content: { outputType: 'array' } } };
    });

    it('generates output port options without an HTTP call', async function () {
        context.properties.generateOutputPortOptions = true;
        await ListTargetHubs.receive(context);
        assert(context.httpRequest.notCalled, 'should not hit the API');
        assert(context.sendJson.calledOnce);
    });

    it('calls the ListTargetHubs endpoint and returns { result, count }', async function () {
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

    it('handles an empty/missing response body', async function () {
        context.httpRequest.resolves({});
        await ListTargetHubs.receive(context);
        assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [], count: 0 });
    });

    describe('toSelectArray', function () {
        it('maps a { result } payload to label/value pairs', function () {
            const out = ListTargetHubs.toSelectArray({ result: [{ key: 'k', name: 'N' }] });
            assert.deepStrictEqual(out, [{ label: 'N', value: 'k' }]);
        });
        it('maps a bare array payload to label/value pairs', function () {
            const out = ListTargetHubs.toSelectArray([{ key: 'k', name: 'N' }]);
            assert.deepStrictEqual(out, [{ label: 'N', value: 'k' }]);
        });
        it('returns an empty array for an unexpected payload', function () {
            assert.deepStrictEqual(ListTargetHubs.toSelectArray({}), []);
        });
    });
});
