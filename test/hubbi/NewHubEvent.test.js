'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const NewHubEvent = require(path.join(__dirname, '../../src/appmixer/hubbi/core/NewHubEvent/NewHubEvent.js'));

describe('Hubbi NewHubEvent (trigger)', function () {

    let context;
    beforeEach(function () {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl', clientKey: 'ck-1', token: 'jwt' };
        context.properties = { conversionKey: 'cv-1', outputType: 'array' };
    });

    describe('start / stop', function () {
        it('start throws CancelError when conversionKey is missing', async function () {
            context.properties.conversionKey = undefined;
            await assert.rejects(
                () => NewHubEvent.start(context),
                e => e.name === 'CancelError' && /Hub is required/.test(e.message)
            );
        });

        it('start saves the webhook URL into state', async function () {
            await NewHubEvent.start(context);
            assert(context.saveState.calledOnce);
            assert.deepStrictEqual(context.saveState.firstCall.args[0], { webhookUrl: context.getWebhookUrl() });
        });

        it('stop clears the state', async function () {
            await NewHubEvent.stop(context);
            assert.deepStrictEqual(context.saveState.firstCall.args[0], {});
        });
    });

    // A Receive Hub and a Start Hub on the same hub in one flow make the flow
    // trigger itself. The option lists are resolved per component and cannot
    // see the flow, so the cycle is rejected at flow start instead.
    describe('start: circular reference guard', function () {

        // The designer stores an action's inputs per incoming connection, under
        // config.transform.<inPort>.<sourceId>.<sourcePort>.lambda - not under
        // config.properties, which is where a trigger keeps its own.
        const startHub = (hub, type) => ({
            type: type || 'appmixer.hubbi.core.StartHub',
            label: 'Start Hub',
            config: {
                transform: { in: { 'receive-hub': { out: { lambda: { conversionKey: hub } } } } }
            }
        });

        beforeEach(function () {
            context.componentId = 'receive-hub';
        });

        it('refuses to start when a Start Hub uses the same hub', async function () {
            context.flowDescriptor = { 'receive-hub': {}, 'start-hub': startHub('cv-1') };
            await assert.rejects(
                () => NewHubEvent.start(context),
                e => e.name === 'CancelError' && /Circular reference/.test(e.message)
            );
            assert(context.saveState.notCalled, 'must not register the webhook');
        });

        it('refuses to start when a Start Hub With Data uses the same hub', async function () {
            context.flowDescriptor = {
                'receive-hub': {},
                'start-hub': startHub('cv-1', 'appmixer.hubbi.core.StartHubWithData')
            };
            await assert.rejects(
                () => NewHubEvent.start(context),
                e => e.name === 'CancelError' && /Circular reference/.test(e.message)
            );
        });

        it('starts when the other component uses a different hub', async function () {
            context.flowDescriptor = { 'receive-hub': {}, 'start-hub': startHub('cv-2') };
            await assert.doesNotReject(() => NewHubEvent.start(context));
            assert(context.saveState.calledOnce);
        });

        it('starts when the hub of the other component is mapped from a previous step', async function () {
            context.flowDescriptor = { 'receive-hub': {}, 'start-hub': startHub('{{{var-hub}}}') };
            await assert.doesNotReject(() => NewHubEvent.start(context));
        });

        it('ignores components of other connectors carrying the same value', async function () {
            context.flowDescriptor = {
                'receive-hub': {},
                'set-var': Object.assign(startHub('cv-1'), { type: 'appmixer.utils.controls.SetVariable' })
            };
            await assert.doesNotReject(() => NewHubEvent.start(context));
        });

        it('starts when the flow has no other component', async function () {
            context.flowDescriptor = { 'receive-hub': {} };
            await assert.doesNotReject(() => NewHubEvent.start(context));
        });
    });

    describe('webhook handling', function () {

        it('emits one message per record when no output type is configured', async function () {
            delete context.properties.outputType;
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [{ id: '1' }, { id: '2' }] } } } };

            await NewHubEvent.receive(context);

            assert.strictEqual(context.sendJson.callCount, 2, 'default output type must be one record at a time');
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { id: '1', index: 0, count: 2 });
            assert.deepStrictEqual(context.sendJson.secondCall.args[0], { id: '2', index: 1, count: 2 });
        });

        it('normalizes a single record object into a one-element array', async function () {
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: { id: '1' } } } } };
            await NewHubEvent.receive(context);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [{ id: '1' }], count: 1 });
            assert(context.response.calledOnce);
        });

        it('preserves a bulk batch (array) of records', async function () {
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [{ id: '1' }, { id: '2' }] } } } };
            await NewHubEvent.receive(context);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [{ id: '1' }, { id: '2' }], count: 2 });
        });

        it('ignores webhooks whose conversionKey does not match', async function () {
            context.messages = { webhook: { content: { data: { conversionKey: 'other', data: { id: '1' } } } } };
            await NewHubEvent.receive(context);
            assert(context.sendJson.notCalled, 'should not emit any record');
            assert(context.response.calledOnce);
        });
    });

    // An event carrying no records is a no-op. Regression cover for the 'array'
    // output type, where an empty 'result' used to be emitted, firing the flow
    // with nothing to process. Empty events now acknowledge and emit nothing.
    describe('webhook handling: empty payload', function () {

        const emptyPayloads = {
            'data key absent': { conversionKey: 'cv-1' },
            'data is null': { conversionKey: 'cv-1', data: null },
            'data is an empty array': { conversionKey: 'cv-1', data: [] }
        };

        ['array', 'object'].forEach(function (outputType) {
            Object.entries(emptyPayloads).forEach(function ([description, payload]) {
                it(`acknowledges without emitting when ${description} (outputType=${outputType})`, async function () {
                    context.properties.outputType = outputType;
                    context.messages = { webhook: { content: { data: payload } } };

                    await assert.doesNotReject(() => NewHubEvent.receive(context));

                    assert(context.sendJson.notCalled, 'should not emit anything for an empty event');
                    assert(context.response.calledOnce, 'must answer the webhook');
                });
            });
        });

        it('still emits normally once the payload carries records', async function () {
            context.properties.outputType = 'object';
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [{ id: '1' }, { id: '2' }] } } } };

            await NewHubEvent.receive(context);

            assert.strictEqual(context.sendJson.callCount, 2);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { id: '1', index: 0, count: 2 });
            assert(context.response.calledOnce);
        });
    });

    describe('generateOutputPortOptions', function () {

        it('builds per-field schema from TargetFields', async function () {
            context.properties.generateOutputPortOptions = true;
            context.httpRequest.resolves({ data: [{ fieldId: 'f1', name: 'First', type: 'string' }] });

            await NewHubEvent.receive(context);

            const req = context.httpRequest.firstCall.args[0];
            assert(/\/Flows\/Home\/TargetFields\?/.test(req.url));
            // array outputType -> first option is the array schema carrying the field properties
            const options = context.sendJson.firstCall.args[0];
            assert.deepStrictEqual(options[0].schema.items.properties.f1, { type: 'string', title: 'First' });
        });

        it('falls back to generic options when loading target fields fails', async function () {
            context.properties.generateOutputPortOptions = true;
            context.httpRequest.rejects(new Error('network down'));

            await NewHubEvent.receive(context);

            // Did not throw; still produced an option list.
            assert(context.sendJson.calledOnce);
            const options = context.sendJson.firstCall.args[0];
            assert(Array.isArray(options));
            assert.deepStrictEqual(options[0].schema.items.properties, {});
        });
    });

    describe('test (Flow Test Mode)', function () {

        const FIELDS = [
            { fieldId: 'f1', name: 'First', type: 'string' },
            { fieldId: 'f2', name: 'Count', type: 'int32' },
            { fieldId: 'f3', name: 'Ratio', type: 'double' },
            { fieldId: 'f4', name: 'Active', type: 'boolean' },
            { fieldId: 'f5', name: 'Seen At', type: 'datetime' },
            { fieldId: 'f6', name: 'Day', type: 'date' },
            { fieldId: 'f7', name: 'Ref', type: 'guid' }
        ];

        const SAMPLE = {
            f1: 'First',
            f2: 42,
            f3: 42.5,
            f4: true,
            f5: '2026-01-01T09:00:00.000Z',
            f6: '2026-01-01',
            f7: '3f2504e0-4f89-11d3-9a0c-0305e82c3301'
        };

        beforeEach(function () {
            context.httpRequest.resolves({ data: FIELDS });
        });

        it('throws when no hub is selected', async function () {
            context.properties.conversionKey = undefined;
            await assert.rejects(() => NewHubEvent.test(context), /No hub selected/);
            assert(context.httpRequest.notCalled);
        });

        it('throws when the hub has no target fields', async function () {
            context.httpRequest.resolves({ data: [] });
            await assert.rejects(() => NewHubEvent.test(context), /no target fields/);
        });

        it('reads the target fields of the configured hub only', async function () {
            await NewHubEvent.test(context);
            assert(context.httpRequest.calledOnce);
            const req = context.httpRequest.firstCall.args[0];
            assert.strictEqual(req.method, 'GET');
            assert.strictEqual(
                req.url,
                'https://test.hubbi.nl/Flows/Home/TargetFields?clientKey=ck-1&conversionKey=cv-1'
            );
        });

        it('never writes state', async function () {
            await NewHubEvent.test(context);
            assert(context.saveState.notCalled);
        });

        it('synthesizes one value per mapped field type (array output)', async function () {
            await NewHubEvent.test(context);
            assert(context.sendJson.calledOnce);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [SAMPLE], count: 1 });
            assert.strictEqual(context.sendJson.firstCall.args[1], 'out');
        });

        it('emits exactly one message for the "object" output type', async function () {
            context.properties.outputType = 'object';
            await NewHubEvent.test(context);
            assert(context.sendJson.calledOnce);
            assert.deepStrictEqual(
                context.sendJson.firstCall.args[0],
                Object.assign({}, SAMPLE, { index: 0, count: 1 })
            );
        });

        it('matches the shape receive() produces for the same record', async function () {
            await NewHubEvent.test(context);
            const fromTest = context.sendJson.firstCall.args[0];

            const live = createMockContext();
            live.auth = context.auth;
            live.properties = { conversionKey: 'cv-1', outputType: 'array' };
            live.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [SAMPLE] } } } };
            await NewHubEvent.receive(live);

            assert.deepStrictEqual(fromTest, live.sendJson.firstCall.args[0]);
        });
    });
});
