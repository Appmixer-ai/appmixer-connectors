'use strict';

const assert = require('assert');
const path = require('path');
const { createMockContext } = require('../utils');

const CallHook = require(path.join(__dirname, '../../src/appmixer/openclaw/core/CallHook/CallHook.js'));

function makeContext() {

    const context = createMockContext({
        auth: { gatewayUrl: 'https://openclaw.example.com', hooksPath: '', token: 'test-token' }
    });
    context.httpRequest.resolves({ status: 202, data: { runId: 'run-1' } });
    return context;
}

async function call(context, input) {

    context.messages = { in: { content: input } };
    await CallHook.receive(context);
    const { data } = context.httpRequest.firstCall.args[0];
    return new URL(data.callbackUrl);
}

async function callback(context, query, data = { final: true, status: 'passed' }) {

    context.messages = { webhook: { content: { query, data } } };
    context.sendJson.resetHistory();
    context.response.resetHistory();
    await CallHook.receive(context);
}

describe('openclaw CallHook callback signature', function() {

    it('start() creates the callback secret once', async function() {

        const context = makeContext();
        await CallHook.start(context);
        const secret = await context.stateGet('callbackSecret');
        assert.match(secret, /^[0-9a-f]{64}$/);
        await CallHook.start(context);
        assert.strictEqual(await context.stateGet('callbackSecret'), secret);
    });

    it('accepts a callback to the URL it handed out', async function() {

        const context = makeContext();
        await CallHook.start(context);
        const url = await call(context, { hook: 'appmixer-echo', payload: '{"issue":42}', correlationId: 'c-1' });
        const query = Object.fromEntries(url.searchParams.entries());
        assert.ok(query.echo);
        assert.match(query.sig, /^[0-9a-f]{64}$/);

        await callback(context, query);
        assert.strictEqual(context.sendJson.callCount, 1);
        const [out, port] = context.sendJson.firstCall.args;
        assert.strictEqual(port, 'done');
        assert.strictEqual(out.hook, 'appmixer-echo');
        assert.strictEqual(out.correlationId, 'c-1');
        assert.strictEqual(out.jobId, JSON.parse(query.echo).jobId);
        assert.deepStrictEqual(context.response.firstCall.args, [{ ok: true }]);
    });

    it('creates the secret on the first call of a component started without one', async function() {

        const context = makeContext();
        const url = await call(context, { hook: 'appmixer-echo' });
        assert.ok(await context.stateGet('callbackSecret'));
        await callback(context, Object.fromEntries(url.searchParams.entries()));
        assert.strictEqual(context.sendJson.callCount, 1);
    });

    it('rejects a forged echo without a signature', async function() {

        const context = makeContext();
        await CallHook.start(context);
        await callback(context, { echo: JSON.stringify({ jobId: 'forged', hook: 'x', correlationId: 'y' }) });
        assert.strictEqual(context.sendJson.callCount, 0);
        assert.strictEqual(context.response.firstCall.args[1], 403);
    });

    it('rejects a tampered echo with the signature of another one', async function() {

        const context = makeContext();
        await CallHook.start(context);
        const url = await call(context, { hook: 'appmixer-echo', correlationId: 'c-1' });
        const echo = JSON.parse(url.searchParams.get('echo'));
        const forged = JSON.stringify({ ...echo, correlationId: 'other' });
        await callback(context, { echo: forged, sig: url.searchParams.get('sig') });
        assert.strictEqual(context.sendJson.callCount, 0);
        assert.strictEqual(context.response.firstCall.args[1], 403);
    });

    it('rejects a malformed signature and a callback before any secret exists', async function() {

        const context = makeContext();
        const echo = JSON.stringify({ jobId: 'j' });
        await callback(context, { echo, sig: '00' });
        assert.strictEqual(context.response.firstCall.args[1], 403);
        assert.strictEqual(await context.stateGet('callbackSecret'), undefined);

        await CallHook.start(context);
        await callback(context, { echo, sig: 'zz'.repeat(32) });
        assert.strictEqual(context.sendJson.callCount, 0);
        assert.strictEqual(context.response.firstCall.args[1], 403);
    });
});
