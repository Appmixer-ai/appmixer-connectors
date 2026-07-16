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

    describe('generateInspector', function () {
        it('returns a read-only webhook URL input', async function () {
            context.properties.generateInspector = true;
            await NewHubEvent.receive(context);
            const { inputs } = context.sendJson.firstCall.args[0];
            assert.strictEqual(inputs.webhookUrl.readonly, true);
            assert.strictEqual(inputs.webhookUrl.value, context.getWebhookUrl());
        });
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

    describe('webhook handling', function () {

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

    // An event carrying no records is a no-op. Regression cover for two distinct
    // failures: in the 'first' output type sendArrayOutput threw a CancelError, so
    // context.response() never ran and Hubbi saw an error instead of an ack; in the
    // 'array' output type an empty 'result' was emitted, firing the flow with
    // nothing to process. Both now acknowledge and emit nothing.
    describe('webhook handling: empty payload', function () {

        const emptyPayloads = {
            'data key absent': { conversionKey: 'cv-1' },
            'data is null': { conversionKey: 'cv-1', data: null },
            'data is an empty array': { conversionKey: 'cv-1', data: [] }
        };

        ['first', 'array', 'object'].forEach(function (outputType) {
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
            context.properties.outputType = 'first';
            context.messages = { webhook: { content: { data: { conversionKey: 'cv-1', data: [{ id: '1' }, { id: '2' }] } } } };

            await NewHubEvent.receive(context);

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
});
