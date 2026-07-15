'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const StartHubWithData = require(path.join(
    __dirname, '../../src/appmixer/hubbi/core/StartHubWithData/StartHubWithData.js'
));

describe('Hubbi StartHubWithData', function () {

    let context;
    beforeEach(function () {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl', clientKey: 'ck-1', token: 'jwt' };
        context.properties = {};
        context.messages = { in: { content: { conversionKey: 'cv-1' } } };
        context.httpRequest.resolves({});
    });

    it('throws CancelError when conversionKey is missing', async function () {
        context.messages.in.content.conversionKey = undefined;
        await assert.rejects(
            () => StartHubWithData.receive(context),
            e => e.name === 'CancelError' && /Conversion Key is required/.test(e.message)
        );
    });

    describe('records.ADD input', function () {

        it('throws CancelError when no records are provided', async function () {
            context.messages.in.content.records = { ADD: [] };
            await assert.rejects(
                () => StartHubWithData.receive(context),
                e => e.name === 'CancelError' && /At least one record is required/.test(e.message)
            );
        });

        it('throws CancelError when records is absent entirely', async function () {
            await assert.rejects(
                () => StartHubWithData.receive(context),
                e => e.name === 'CancelError' && /At least one record is required/.test(e.message)
            );
        });

        it('posts the ADD rows and reports the count', async function () {
            const rows = [{ f1: 'a' }, { f1: 'b' }];
            context.messages.in.content.records = { ADD: rows };

            await StartHubWithData.receive(context);

            const req = context.httpRequest.firstCall.args[0];
            assert.strictEqual(req.method, 'POST');
            assert.strictEqual(
                req.url,
                'https://test.hubbi.nl/Flows/Home/HubsStartWithData?clientKey=ck-1&conversionKey=cv-1'
            );
            assert.deepStrictEqual(req.data, rows);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { conversionKey: 'cv-1', count: 2 });
        });
    });

    describe('error reclassification', function () {

        beforeEach(function () {
            context.messages.in.content.records = { ADD: [{ f1: 'a' }] };
        });

        it('reclassifies HTTP 409 as retryable', async function () {
            const err = new Error('conflict');
            err.response = { status: 409 };
            context.httpRequest.rejects(err);
            await assert.rejects(
                () => StartHubWithData.receive(context),
                e => e.name !== 'CancelError' && /409/.test(e.message)
            );
        });

        it('reclassifies HTTP 423 as a CancelError', async function () {
            const err = new Error('locked');
            err.response = { status: 423 };
            context.httpRequest.rejects(err);
            await assert.rejects(
                () => StartHubWithData.receive(context),
                e => e.name === 'CancelError' && /423/.test(e.message)
            );
        });
    });

    describe('generateInspector', function () {

        it('returns a base schema when no conversionKey is set', async function () {
            context.properties = { generateInspector: true };
            await StartHubWithData.receive(context);
            assert(context.httpRequest.notCalled);
            const { schema, inputs } = context.sendJson.firstCall.args[0];
            assert.deepStrictEqual(schema.required, ['conversionKey']);
            assert(inputs.conversionKey);
            assert(inputs.records);
            assert(!inputs.inputMode, 'the records-source switch must be removed');
            assert(!inputs.recordsArray, 'the array input must be removed');
        });

        it('builds record fields from SourceFields when conversionKey is set', async function () {
            context.properties = { generateInspector: true, conversionKey: 'cv-1' };
            context.httpRequest.resolves({ data: [
                { fieldId: 'f1', name: 'First', type: 'string' },
                { fieldId: 'f2', name: 'Count', type: 'int32' }
            ] });

            await StartHubWithData.receive(context);

            const req = context.httpRequest.firstCall.args[0];
            assert(/\/Flows\/Home\/SourceFields\?/.test(req.url));
            const { inputs } = context.sendJson.firstCall.args[0];
            assert.strictEqual(inputs.records.fields.f1.type, 'text');
            assert.strictEqual(inputs.records.fields.f2.type, 'number');
            assert(!inputs.records.when, 'records must always be visible (no inputMode gate)');
        });
    });
});
