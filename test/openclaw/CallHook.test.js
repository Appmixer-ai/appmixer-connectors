'use strict';

const assert = require('assert');
const crypto = require('crypto');
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

    it('accepts a callback to the URL it handed out', async function() {

        const context = makeContext();
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

    it('keeps no secret in component state', async function() {

        const context = makeContext();
        await call(context, { hook: 'appmixer-echo' });
        assert.strictEqual(context.stateSet.callCount, 0);
    });

    it('accepts a callback after a flow restart wiped the component state', async function() {

        const context = makeContext();
        const url = await call(context, { hook: 'appmixer-echo', correlationId: 'c-1' });
        // a stop/start of the flow: component state is gone, the account and component ID stay
        const restarted = makeContext();
        await callback(restarted, Object.fromEntries(url.searchParams.entries()));
        assert.strictEqual(restarted.sendJson.callCount, 1);
        assert.strictEqual(restarted.sendJson.firstCall.args[0].correlationId, 'c-1');
    });

    it('rejects a callback signed for another component or another hook token', async function() {

        const context = makeContext();
        const query = Object.fromEntries((await call(context, { hook: 'appmixer-echo' })).searchParams.entries());

        const otherComponent = makeContext();
        otherComponent.componentId = 'componentId-2';
        await callback(otherComponent, query);
        assert.strictEqual(otherComponent.sendJson.callCount, 0);
        assert.strictEqual(otherComponent.response.firstCall.args[1], 403);

        const otherToken = makeContext();
        otherToken.auth.token = 'rotated-token';
        await callback(otherToken, query);
        assert.strictEqual(otherToken.sendJson.callCount, 0);
        assert.strictEqual(otherToken.response.firstCall.args[1], 403);
    });

    it('still accepts a URL signed with the 1.0.1 secret kept in component state', async function() {

        const context = makeContext();
        const legacy = 'ab'.repeat(32);
        await context.stateSet('callbackSecret', legacy);
        const echo = JSON.stringify({ jobId: 'j-legacy', hook: 'appmixer-echo', correlationId: '' });
        const sig = crypto.createHmac('sha256', legacy).update(echo).digest('hex');
        await callback(context, { echo, sig });
        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.firstCall.args[0].jobId, 'j-legacy');
    });

    it('refuses the call when the account has no hook token', async function() {

        const context = makeContext();
        context.auth.token = '';
        context.messages = { in: { content: { hook: 'appmixer-echo' } } };
        await assert.rejects(() => CallHook.receive(context), /no hook token/);
        assert.strictEqual(context.httpRequest.callCount, 0);
    });

    it('rejects a forged echo without a signature', async function() {

        const context = makeContext();
        await callback(context, { echo: JSON.stringify({ jobId: 'forged', hook: 'x', correlationId: 'y' }) });
        assert.strictEqual(context.sendJson.callCount, 0);
        assert.strictEqual(context.response.firstCall.args[1], 403);
    });

    it('rejects a tampered echo with the signature of another one', async function() {

        const context = makeContext();
        const url = await call(context, { hook: 'appmixer-echo', correlationId: 'c-1' });
        const echo = JSON.parse(url.searchParams.get('echo'));
        const forged = JSON.stringify({ ...echo, correlationId: 'other' });
        await callback(context, { echo: forged, sig: url.searchParams.get('sig') });
        assert.strictEqual(context.sendJson.callCount, 0);
        assert.strictEqual(context.response.firstCall.args[1], 403);
    });

    it('rejects a malformed or a wrong signature', async function() {

        const context = makeContext();
        const echo = JSON.stringify({ jobId: 'j' });
        await callback(context, { echo, sig: '00' });
        assert.strictEqual(context.response.firstCall.args[1], 403);

        await callback(context, { echo, sig: 'zz'.repeat(32) });
        assert.strictEqual(context.sendJson.callCount, 0);
        assert.strictEqual(context.response.firstCall.args[1], 403);
    });
});
