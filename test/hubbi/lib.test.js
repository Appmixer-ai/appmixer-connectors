'use strict';

const path = require('path');
const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../utils');

const lib = require(path.join(__dirname, '../../src/appmixer/hubbi/lib.js'));

describe('Hubbi lib', function() {

    describe('mapFieldType', function() {

        it('maps integer-like .NET types to integer', function() {
            ['int16', 'int32', 'int64', 'long', 'short', 'byte', 'sbyte', 'uint16', 'uint32', 'uint64', 'integer']
                .forEach(t => {
                    const r = lib.mapFieldType(t);
                    assert.strictEqual(r.inspectorType, 'number');
                    assert.deepStrictEqual(r.schema, { type: 'integer', example: 42 });
                });
        });

        it('maps floating-point types to number', function() {
            ['double', 'decimal', 'single', 'float'].forEach(t => {
                const r = lib.mapFieldType(t);
                assert.strictEqual(r.inspectorType, 'number');
                assert.deepStrictEqual(r.schema, { type: 'number', example: 42.5 });
            });
        });

        it('maps boolean types to toggle', function() {
            ['boolean', 'bool'].forEach(t => {
                const r = lib.mapFieldType(t);
                assert.strictEqual(r.inspectorType, 'toggle');
                assert.deepStrictEqual(r.schema, { type: 'boolean', example: true });
            });
        });

        it('maps datetime types to date-time with enableTime', function() {
            ['datetime', 'datetimeoffset'].forEach(t => {
                const r = lib.mapFieldType(t);
                assert.strictEqual(r.inspectorType, 'date-time');
                assert.deepStrictEqual(r.inspectorConfig, { enableTime: true });
                assert.deepStrictEqual(r.schema, { type: 'string', format: 'date-time', example: '2026-01-01T09:00:00.000Z' });
            });
        });

        it('maps date-only types to date', function() {
            ['date', 'dateonly'].forEach(t => {
                const r = lib.mapFieldType(t);
                assert.strictEqual(r.inspectorType, 'date-time');
                assert.deepStrictEqual(r.schema, { type: 'string', format: 'date', example: '2026-01-01' });
            });
        });

        it('maps guid/uuid types to uuid string', function() {
            ['guid', 'uuid'].forEach(t => {
                const r = lib.mapFieldType(t);
                assert.strictEqual(r.inspectorType, 'text');
                assert.deepStrictEqual(r.schema, { type: 'string', format: 'uuid', example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' });
            });
        });

        it('maps string / empty / unknown types to plain string', function() {
            ['string', 'char', '', undefined, null, 'somethingWeird'].forEach(t => {
                const r = lib.mapFieldType(t);
                assert.strictEqual(r.inspectorType, 'text');
                assert.deepStrictEqual(r.schema, { type: 'string', example: 'Example value' });
            });
        });

        // Observed live: TargetFields answers with "System.Int32" / "System.Guid"
        // while SourceFields answers with "Int32" / "Guid" for the same types.
        // Qualified names used to fall through to the string default, so a
        // number, date or GUID coming from a hub was described as text.
        it('maps fully qualified .NET type names', function() {
            const cases = [
                ['System.String', 'text', { type: 'string', example: 'Example value' }],
                ['System.Int32', 'number', { type: 'integer', example: 42 }],
                ['System.Double', 'number', { type: 'number', example: 42.5 }],
                ['System.Boolean', 'toggle', { type: 'boolean', example: true }],
                ['System.Guid', 'text', { type: 'string', format: 'uuid', example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' }],
                ['System.DateTime', 'date-time', { type: 'string', format: 'date-time', example: '2026-01-01T09:00:00.000Z' }]
            ];
            cases.forEach(([netType, inspectorType, schema]) => {
                const r = lib.mapFieldType(netType);
                assert.strictEqual(r.inspectorType, inspectorType, netType);
                assert.deepStrictEqual(r.schema, schema, netType);
            });
        });

        it('unwraps a nullable type', function() {
            const r = lib.mapFieldType('System.Nullable`1[System.Int32]');
            assert.strictEqual(r.inspectorType, 'number');
            assert.deepStrictEqual(r.schema, { type: 'integer', example: 42 });
        });

        it('is case-insensitive and trims whitespace', function() {
            const r = lib.mapFieldType('  DateTime  ');
            assert.strictEqual(r.inspectorType, 'date-time');
            assert.deepStrictEqual(r.schema, { type: 'string', format: 'date-time', example: '2026-01-01T09:00:00.000Z' });
        });
    });

    describe('rethrowHubbiError', function() {

        let context;
        beforeEach(function() {
            context = createMockContext();
        });

        it('re-throws HTTP 409 as a plain (retryable) Error', function() {
            const err = new Error('conflict');
            err.response = { status: 409 };
            assert.throws(
                () => lib.rethrowHubbiError(context, err),
                e => e.name !== 'CancelError' && /409/.test(e.message)
            );
        });

        it('re-throws HTTP 423 as a CancelError (no retry)', function() {
            const err = new Error('locked');
            err.response = { status: 423 };
            assert.throws(
                () => lib.rethrowHubbiError(context, err),
                e => e.name === 'CancelError' && /423/.test(e.message)
            );
        });

        it('re-throws other HTTP errors untouched', function() {
            const err = new Error('server error');
            err.response = { status: 500 };
            assert.throws(() => lib.rethrowHubbiError(context, err), e => e === err);
        });

        it('re-throws errors without an HTTP response untouched', function() {
            const err = new Error('network down');
            assert.throws(() => lib.rethrowHubbiError(context, err), e => e === err);
        });
    });

    describe('sendArrayOutput', function() {

        let context;
        beforeEach(function() {
            context = createMockContext();
        });

        it('array: wraps records in { result, count }', async function() {
            const records = [{ a: 1 }, { a: 2 }];
            await lib.sendArrayOutput({ context, outputType: 'array', records });
            assert(context.sendJson.calledOnce);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: records, count: 2 });
            assert.strictEqual(context.sendJson.firstCall.args[1], 'out');
        });

        it('first: emits the first record with index/count', async function() {
            const records = [{ a: 1 }, { a: 2 }];
            await lib.sendArrayOutput({ context, outputType: 'first', records });
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { a: 1, index: 0, count: 2 });
        });

        it('first: throws CancelError when there are no records', async function() {
            await assert.rejects(
                () => lib.sendArrayOutput({ context, outputType: 'first', records: [] }),
                e => e.name === 'CancelError'
            );
        });

        it('object: emits one message per record with index/count', async function() {
            const records = [{ a: 1 }, { a: 2 }];
            await lib.sendArrayOutput({ context, outputType: 'object', records });
            assert.strictEqual(context.sendJson.callCount, 2);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { a: 1, index: 0, count: 2 });
            assert.deepStrictEqual(context.sendJson.secondCall.args[0], { a: 2, index: 1, count: 2 });
        });

        it('file: saves a CSV and emits the file id', async function() {
            context.saveFileStream = sinon.stub().resolves({ fileId: 'file-1' });
            const records = [{ id: '1', name: 'Foo' }, { id: '2', name: 'Bar' }];
            await lib.sendArrayOutput({ context, outputType: 'file', records });

            assert(context.saveFileStream.calledOnce);
            const [fileName, buffer] = context.saveFileStream.firstCall.args;
            assert(/\.csv$/.test(fileName), 'file name should end with .csv');
            const csv = buffer.toString('utf8');
            assert.strictEqual(csv.split('\n')[0], 'id,name');
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { fileId: 'file-1' });
        });

        it('throws CancelError for an unsupported outputType', async function() {
            await assert.rejects(
                () => lib.sendArrayOutput({ context, outputType: 'nonsense', records: [] }),
                e => e.name === 'CancelError'
            );
        });
    });

    describe('getOutputPortOptions', function() {

        let context;
        const itemSchema = {
            key: { type: 'string', title: 'Hub Key', example: 'k1' },
            name: { type: 'string', title: 'Name', example: 'Hub 1' }
        };

        beforeEach(function() {
            context = createMockContext();
        });

        it('object/first: returns flat field options plus Index and Count', function() {
            lib.getOutputPortOptions(context, 'object', itemSchema, { label: 'Hubs', value: 'result' });
            const options = context.sendJson.firstCall.args[0];
            assert.deepStrictEqual(options[0], { label: 'Current Item Index', value: 'index', schema: { type: 'integer', example: 0 } });
            assert.deepStrictEqual(options[1], { label: 'Items Count', value: 'count', schema: { type: 'integer', example: 3 } });
            // title is stripped from per-field schema and surfaced as label
            const keyOption = options.find(o => o.value === 'key');
            assert.strictEqual(keyOption.label, 'Hub Key');
            // title is stripped, the example survives so the picker can preview it
            assert.deepStrictEqual(keyOption.schema, { type: 'string', example: 'k1' });
        });

        it('array: returns an array schema option plus Items Count', function() {
            lib.getOutputPortOptions(context, 'array', itemSchema, { label: 'Hubs', value: 'result' });
            const options = context.sendJson.firstCall.args[0];
            assert.strictEqual(options[0].label, 'Hubs');
            assert.strictEqual(options[0].value, 'result');
            assert.strictEqual(options[0].schema.type, 'array');
            assert.deepStrictEqual(options[0].schema.items, { type: 'object', properties: itemSchema });
            assert.deepStrictEqual(options[1], { label: 'Items Count', value: 'count', schema: { type: 'integer', example: 3 } });
        });

        it('file: returns a single File ID option', function() {
            lib.getOutputPortOptions(context, 'file', itemSchema, { label: 'Hubs', value: 'result' });
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], [{
                label: 'File ID',
                value: 'fileId',
                schema: { type: 'string', example: '5f2a1c8e4b3d2a1908f7e6d5' }
            }]);
        });

        // The components pass context.messages.in.content.outputType straight
        // through, and that is empty until the user saves the inspector. Falling
        // through used to leave the designer's request unanswered.
        it('defaults to the array options when no outputType is given', function() {
            lib.getOutputPortOptions(context, undefined, itemSchema, { label: 'Hubs', value: 'result' });
            const options = context.sendJson.firstCall.args[0];
            assert.strictEqual(options[0].label, 'Hubs');
            assert.strictEqual(options[0].schema.type, 'array');
        });

        it('throws on an unknown outputType instead of answering with nothing', function() {
            assert.throws(
                () => lib.getOutputPortOptions(context, 'nonsense', itemSchema, { label: 'Hubs', value: 'result' }),
                e => e.name === 'CancelError' && /Unsupported outputType nonsense/.test(e.message)
            );
            assert(context.sendJson.notCalled);
        });
    });
});
