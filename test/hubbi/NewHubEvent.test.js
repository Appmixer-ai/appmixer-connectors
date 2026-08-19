'use strict';

const path = require('path');
const assert = require('assert');
const { createMockContext } = require('../utils');

const NewHubEvent = require(path.join(__dirname, '../../src/appmixer/hubbi/core/NewHubEvent/NewHubEvent.js'));

describe('Hubbi NewHubEvent (trigger)', function() {

    let context;
    beforeEach(function() {
        context = createMockContext();
        context.auth = { baseUrl: 'https://test.hubbi.nl', clientKey: 'ck-1', token: 'jwt' };
        context.properties = { conversionKey: 'cv-1', outputType: 'array' };
    });

    describe('start / stop', function() {
        it('start throws CancelError when conversionKey is missing', async function() {
            context.properties.conversionKey = undefined;
            await assert.rejects(
                () => NewHubEvent.start(context),
                e => e.name === 'CancelError' && /Hub is required/.test(e.message)
            );
        });

        it('start saves the webhook URL into state', async function() {
            await NewHubEvent.start(context);
            assert(context.saveState.calledOnce);
            assert.deepStrictEqual(context.saveState.firstCall.args[0], { webhookUrl: context.getWebhookUrl() });
        });

        it('stop clears the state', async function() {
            await NewHubEvent.stop(context);
            assert.deepStrictEqual(context.saveState.firstCall.args[0], {});
        });
    });

    // A Receive Hub and a Start Hub on the same hub in one flow make the flow
    // trigger itself. The option lists are resolved per component and cannot
    // see the flow, so the cycle is rejected at flow start instead.
    describe('start: circular reference guard', function() {

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

        beforeEach(function() {
            context.componentId = 'receive-hub';
        });

        it('refuses to start when a Start Hub uses the same hub', async function() {
            context.flowDescriptor = { 'receive-hub': {}, 'start-hub': startHub('cv-1') };
            await assert.rejects(
                () => NewHubEvent.start(context),
                e => e.name === 'CancelError' && /Circular reference/.test(e.message)
            );
            assert(context.saveState.notCalled, 'must not register the webhook');
        });

        it('refuses to start when a Start Hub With Data uses the same hub', async function() {
            context.flowDescriptor = {
                'receive-hub': {},
                'start-hub': startHub('cv-1', 'appmixer.hubbi.core.StartHubWithData')
            };
            await assert.rejects(
                () => NewHubEvent.start(context),
                e => e.name === 'CancelError' && /Circular reference/.test(e.message)
            );
        });

        it('starts when the other component uses a different hub', async function() {
            context.flowDescriptor = { 'receive-hub': {}, 'start-hub': startHub('cv-2') };
            await assert.doesNotReject(() => NewHubEvent.start(context));
            assert(context.saveState.calledOnce);
        });

        it('starts when the hub of the other component is mapped from a previous step', async function() {
            context.flowDescriptor = { 'receive-hub': {}, 'start-hub': startHub('{{{var-hub}}}') };
            await assert.doesNotReject(() => NewHubEvent.start(context));
        });

        it('ignores components of other connectors carrying the same value', async function() {
            context.flowDescriptor = {
                'receive-hub': {},
                'set-var': Object.assign(startHub('cv-1'), { type: 'appmixer.utils.controls.SetVariable' })
            };
            await assert.doesNotReject(() => NewHubEvent.start(context));
        });

        it('starts when the flow has no other component', async function() {
            context.flowDescriptor = { 'receive-hub': {} };
            await assert.doesNotReject(() => NewHubEvent.start(context));
        });
    });

    describe('webhook handling', function() {

        it('emits one message per record when no output type is configured', async function() {
            delete context.properties.outputType;
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [{ id: '1' }, { id: '2' }] } } } };

            await NewHubEvent.receive(context);

            assert.strictEqual(context.sendJson.callCount, 2, 'default output type must be one record at a time');
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { id: '1', index: 0, count: 2 });
            assert.deepStrictEqual(context.sendJson.secondCall.args[0], { id: '2', index: 1, count: 2 });
        });

        it('normalizes a single record object into a one-element array', async function() {
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: { id: '1' } } } } };
            await NewHubEvent.receive(context);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [{ id: '1' }], count: 1 });
            assert(context.response.calledOnce);
        });

        it('preserves a bulk batch (array) of records', async function() {
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [{ id: '1' }, { id: '2' }] } } } };
            await NewHubEvent.receive(context);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { result: [{ id: '1' }, { id: '2' }], count: 2 });
        });

        it('ignores webhooks whose conversionKey does not match', async function() {
            context.messages = { webhook: { content: { data: { conversionKey: 'other', data: { id: '1' } } } } };
            await NewHubEvent.receive(context);
            assert(context.sendJson.notCalled, 'should not emit any record');
            assert(context.response.calledOnce);
        });
    });

    // An event carrying no records is a no-op. Regression cover for the 'array'
    // output type, where an empty 'result' used to be emitted, firing the flow
    // with nothing to process. Empty events now acknowledge and emit nothing.
    describe('webhook handling: empty payload', function() {

        const emptyPayloads = {
            'data key absent': { conversionKey: 'cv-1' },
            'data is null': { conversionKey: 'cv-1', data: null },
            'data is an empty array': { conversionKey: 'cv-1', data: [] }
        };

        ['array', 'object'].forEach(function(outputType) {
            Object.entries(emptyPayloads).forEach(function([description, payload]) {
                it(`acknowledges without emitting when ${description} (outputType=${outputType})`, async function() {
                    context.properties.outputType = outputType;
                    context.messages = { webhook: { content: { data: payload } } };

                    await assert.doesNotReject(() => NewHubEvent.receive(context));

                    assert(context.sendJson.notCalled, 'should not emit anything for an empty event');
                    assert(context.response.calledOnce, 'must answer the webhook');
                });
            });
        });

        it('still emits normally once the payload carries records', async function() {
            context.properties.outputType = 'object';
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [{ id: '1' }, { id: '2' }] } } } };

            await NewHubEvent.receive(context);

            assert.strictEqual(context.sendJson.callCount, 2);
            assert.deepStrictEqual(context.sendJson.firstCall.args[0], { id: '1', index: 0, count: 2 });
            assert(context.response.calledOnce);
        });
    });

    describe('generateOutputPortOptions', function() {

        it('builds per-field schema from TargetFields', async function() {
            context.properties.generateOutputPortOptions = true;
            context.httpRequest.resolves({ data: [{ fieldId: 'f1', name: 'First', type: 'string' }] });

            await NewHubEvent.receive(context);

            const req = context.httpRequest.firstCall.args[0];
            assert(/\/Flows\/Home\/TargetFields\?/.test(req.url));
            // array outputType -> first option is the array schema carrying the field properties
            const options = context.sendJson.firstCall.args[0];
            assert.deepStrictEqual(
                options[0].schema.items.properties.f1,
                { type: 'string', example: 'Example value', title: 'First' }
            );
        });

        it('falls back to generic options when loading target fields fails', async function() {
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

    // HubBI pushes hub events to the webhook URL and exposes no endpoint for
    // reading past ones, so there is no real example to emit. Per the trigger
    // test() rules, that means throwing - never fabricating a record.
    describe('test (Flow Test Mode)', function() {

        it('throws a CancelError explaining no example can be fetched', async function() {
            await assert.rejects(
                () => NewHubEvent.test(context),
                e => e.name === 'CancelError' && /no real example can be fetched/.test(e.message)
            );
        });

        it('does not fabricate a record', async function() {
            await assert.rejects(() => NewHubEvent.test(context));
            assert(context.sendJson.notCalled, 'must not emit synthetic data');
        });

        it('does not call the API or write state', async function() {
            await assert.rejects(() => NewHubEvent.test(context));
            assert(context.httpRequest.notCalled);
            assert(context.saveState.notCalled);
        });

        it('throws regardless of how the trigger is configured', async function() {
            context.properties = { conversionKey: 'cv-9', outputType: 'array' };
            await assert.rejects(() => NewHubEvent.test(context), e => e.name === 'CancelError');
        });
    });
});
