'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const ListSourceHubsWithoutPostData = require(path.join(
    __dirname, '../../src/appmixer/hubbi/core/ListSourceHubsWithoutPostData/ListSourceHubsWithoutPostData.js'
));

describe('Hubbi ListSourceHubsWithoutPostData', function () {

    let context;
    beforeEach(function () {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl', clientKey: 'ck-1', token: 'jwt' };
        context.properties = {};
        context.messages = { in: { content: { outputType: 'array' } } };
    });

    it('generates output port options without an HTTP call', async function () {
        context.properties.generateOutputPortOptions = true;
        await ListSourceHubsWithoutPostData.receive(context);
        assert(context.httpRequest.notCalled);
        assert(context.sendJson.calledOnce);
    });

    it('calls the ListSourceHubsWithoutPostData endpoint and returns { result, count }', async function () {
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

    it('toSelectArray maps hubs to label/value pairs', function () {
        const out = ListSourceHubsWithoutPostData.toSelectArray([{ key: 'k', name: 'N' }]);
        assert.deepStrictEqual(out, [{ label: 'N', value: 'k' }]);
    });
});
