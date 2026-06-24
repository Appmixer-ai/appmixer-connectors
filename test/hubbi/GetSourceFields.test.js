'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const GetSourceFields = require(path.join(__dirname, '../../src/appmixer/hubbi/core/GetSourceFields/GetSourceFields.js'));

describe('Hubbi GetSourceFields', function () {

    let context;
    beforeEach(function () {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl', clientKey: 'ck-1', token: 'jwt' };
        context.properties = {};
        context.messages = { in: { content: { outputType: 'array', conversionKey: 'cv-1' } } };
    });

    it('throws CancelError when conversionKey is missing', async function () {
        context.messages.in.content.conversionKey = undefined;
        await assert.rejects(
            () => GetSourceFields.receive(context),
            e => e.name === 'CancelError' && /Conversion Key is required/.test(e.message)
        );
    });

    it('generates output port options without an HTTP call', async function () {
        context.properties.generateOutputPortOptions = true;
        await GetSourceFields.receive(context);
        assert(context.httpRequest.notCalled);
        assert(context.sendJson.calledOnce);
    });

    it('calls the SourceFields endpoint with clientKey and conversionKey', async function () {
        const fields = [{ fieldId: 'f1', name: 'First', type: 'string' }];
        context.httpRequest.resolves({ data: fields });

        await GetSourceFields.receive(context);

        const req = context.httpRequest.firstCall.args[0];
        assert.strictEqual(
            req.url,
            'https://test.hubbi.nl/Flows/Home/SourceFields?clientKey=ck-1&conversionKey=cv-1'
        );
        assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: fields, count: 1 });
    });
});
