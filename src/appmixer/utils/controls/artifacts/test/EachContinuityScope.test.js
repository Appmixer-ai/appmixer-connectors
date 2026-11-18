'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const Each = require('../../Each/Each');
const { MAX_WAIT_MARGIN } = require('../../Each/continuityScope');

const WEBHOOK_URL = 'https://api.appmixer.test/flows/flow-1/components/each-1' +
    '?correlationId=corr-1&correlationInPort=in&messageId=msg-1';

/**
 * A context for an `in` message with a recording context.setMaxWait().
 * @param {Object} content - The `in` message content
 * @param {Object} [options]
 * @returns {Object}
 */
function createContext(content, options = {}) {

    const context = createMockContext({
        id: 'each-run-1',
        config: options.config || {},
        messages: { in: { content } },
        properties: {}
    });
    context.flowId = 'flow-1';
    context.componentId = 'each-1';
    context.log = sinon.stub();
    context.getWebhookUrl = sinon.stub().returns(WEBHOOK_URL);
    context.callAppmixer = sinon.stub().resolves({ success: true });
    context.setTimeout = sinon.stub().resolves('timeout-0');
    context.flow = { stateGet: sinon.stub(), stateSet: sinon.stub(), stateUnset: sinon.stub() };
    context.setMaxWait = sinon.stub().resolves();
    return context;
}

/**
 * The only setMaxWait() call, checked to be a Date within [from, to].
 * @param {Object} context
 * @param {number} from - ms timestamp
 * @param {number} to - ms timestamp
 */
function assertMaxWaitBetween(context, from, to) {

    assert.strictEqual(context.setMaxWait.callCount, 1);
    const [expiresAt] = context.setMaxWait.firstCall.args;
    // A plain number would be taken as milliseconds from now, not as a timestamp.
    assert.ok(expiresAt instanceof Date, 'setMaxWait() must get a Date');
    assert.ok(expiresAt.getTime() >= from && expiresAt.getTime() <= to,
        `expected ${new Date(from).toISOString()}..${new Date(to).toISOString()}, got ${expiresAt.toISOString()}`);
}

describe('Each Component - continuity scope lifetime', () => {

    afterEach(() => {
        sinon.restore();
    });

    it('a parallel loop lets the continuity scope go at once, before any item is sent', async () => {
        const context = createContext({ list: ['a', 'b', 'c'] });
        const before = Date.now();

        await Each.receive(context);

        assertMaxWaitBetween(context, before, Date.now());
        assert.ok(context.setMaxWait.calledBefore(context.sendJson));
        assert.strictEqual(context.sendJson.callCount, 4);
    });

    it('a delayed loop lets the continuity scope go at once', async () => {
        const context = createContext({ list: ['a', 'b', 'c'], delay: 25 }, { config: { timeoutIntervalMs: 100 } });
        const before = Date.now();

        await Each.receive(context);

        assertMaxWaitBetween(context, before, Date.now());
    });

    it('a parallel loop with an invalid input lets the continuity scope go', async () => {
        const context = createContext({ list: 'not valid json' });
        const before = Date.now();

        await assert.rejects(() => Each.receive(context), err => err instanceof context.CancelError);

        assertMaxWaitBetween(context, before, Date.now());
    });

    it('a sequential loop keeps the continuity scope until the loop can be over', async () => {
        const context = createContext({ list: ['a', 'b', 'c'], sequential: true, itemTimeout: 120, delay: 500 });
        const before = Date.now();

        await Each.receive(context);

        const loop = 3 * (120 * 1000 + 500);
        assertMaxWaitBetween(context, before + loop + MAX_WAIT_MARGIN, Date.now() + loop + MAX_WAIT_MARGIN);
        // Set before the first item goes out, so the acknowledgement can never find the scope gone.
        assert.ok(context.setMaxWait.calledBefore(context.sendJson));
        assert.deepStrictEqual(context.sendJson.firstCall.args, [
            { index: 0, value: 'a', count: 3, correlationId: 'each-run-1' }, 'item'
        ]);
    });

    it('a sequential loop uses the default item timeout for its lifetime', async () => {
        const context = createContext({ list: ['a', 'b'], sequential: true });
        const before = Date.now();

        await Each.receive(context);

        const loop = 2 * 300 * 1000;
        assertMaxWaitBetween(context, before + loop + MAX_WAIT_MARGIN, Date.now() + loop + MAX_WAIT_MARGIN);
    });

    it('a sequential loop over an empty list lets the continuity scope go', async () => {
        const context = createContext({ list: [], sequential: true });
        const before = Date.now();

        await Each.receive(context);

        assertMaxWaitBetween(context, before, Date.now());
        assert.deepStrictEqual(context.sendJson.firstCall.args, [
            { count: 0, correlationId: 'each-run-1', result: [] }, 'done'
        ]);
    });

    it('a sequential loop over a non-array lets the continuity scope go', async () => {
        const context = createContext({ list: { key: 'value' }, sequential: true });
        const before = Date.now();

        await Each.receive(context);

        assertMaxWaitBetween(context, before, Date.now());
    });

    it('a sequential loop with a rejected input lets the continuity scope go', async () => {
        const context = createContext({ list: ['a'], sequential: true, itemTimeout: 5 });
        const before = Date.now();

        await assert.rejects(() => Each.receive(context), err => err instanceof context.CancelError);

        assertMaxWaitBetween(context, before, Date.now());
    });

    it('a sequential loop keeps the continuity scope when the start fails with a retryable error', async () => {
        const context = createContext({ list: ['a', 'b'], sequential: true });
        context.sendJson = sinon.stub().rejects(new Error('ECONNRESET'));
        const before = Date.now();

        await assert.rejects(() => Each.receive(context), /ECONNRESET/);

        // Only the loop lifetime, no release: the engine re-delivers `in` and the retry needs the scope.
        const loop = 2 * 300 * 1000;
        assertMaxWaitBetween(context, before + loop + MAX_WAIT_MARGIN, Date.now() + loop + MAX_WAIT_MARGIN);
    });

    it('a re-delivered `in` of a running sequential loop does not touch the lifetime', async () => {
        const context = createContext({ list: ['a', 'b'], sequential: true });
        context.stateGet = sinon.stub().resolves({ index: 0, count: 2 });

        await Each.receive(context);

        assert.strictEqual(context.setMaxWait.callCount, 0);
        assert.strictEqual(context.sendJson.callCount, 0);
    });

    it('the acknowledgement and the item timeout do not touch the lifetime', async () => {
        const ack = createMockContext({
            id: 'webhook-ctx',
            messages: { webhook: { content: { data: { id: 'each-run-1', index: 0 } } } },
            properties: {}
        });
        ack.setMaxWait = sinon.stub().resolves();
        ack.log = sinon.stub();
        await Each.receive(ack);
        assert.strictEqual(ack.setMaxWait.callCount, 0);

        const timeout = createMockContext({
            id: 'timeout-ctx',
            messages: { timeout: { content: { id: 'each-run-1', sequential: true, index: 0 } } },
            properties: {}
        });
        timeout.setMaxWait = sinon.stub().resolves();
        await Each.receive(timeout);
        assert.strictEqual(timeout.setMaxWait.callCount, 0);
    });

    it('a failing setMaxWait() is logged and does not stop the loop', async () => {
        const context = createContext({ list: ['a', 'b'] });
        context.setMaxWait = sinon.stub().rejects(new Error('boom'));

        await Each.receive(context);

        assert.strictEqual(context.sendJson.callCount, 3);
        assert.ok(context.log.calledWithMatch({ step: 'continuity-scope' }));
    });

    it('works on an engine without setMaxWait()', async () => {
        const context = createContext({ list: ['a', 'b'] });
        delete context.setMaxWait;

        await Each.receive(context);

        assert.strictEqual(context.sendJson.callCount, 3);
    });
});
