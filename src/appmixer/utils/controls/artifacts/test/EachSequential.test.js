'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const Each = require('../../Each/Each');
const ContinueEach = require('../../ContinueEach/ContinueEach');

const WEBHOOK_URL = 'https://api.appmixer.test/flows/flow-1/components/each-1' +
    '?correlationId=corr-1&correlationInPort=in&messageId=msg-1';

/**
 * A minimal stand-in for the engine around one sequential Each: component state and the plugin
 * store (routes.js) are shared by every receive() call, exactly like in a running flow.
 */
function createHarness() {

    const state = {};
    const store = {};
    const sent = [];
    const timeouts = [];
    const cleared = [];
    const triggered = [];

    const callAppmixer = async ({ endPoint, method, body }) => {
        const [path, query] = endPoint.replace('/plugins/appmixer/utils/controls/', '').split('?');
        const [rawId, action] = path.split('/');
        const id = decodeURIComponent(rawId);

        if (method === 'POST' && action === 'next') {
            const record = store[id];
            if (!record || !record.sequential) {
                return { success: false, error: 'Not found' };
            }
            triggered.push({ id, index: body.index, query: record.webhookQuery });
            return { success: true, id, index: body.index };
        }
        if (method === 'POST') {
            store[id] = body;
            return { success: true, id };
        }
        if (method === 'GET') {
            const record = store[id];
            if (!record) {
                return null;
            }
            if (query) {
                const index = parseInt(query.split('=')[1], 10);
                const { items, ...meta } = record;
                return { ...meta, item: items[index] };
            }
            return record;
        }
        if (method === 'DELETE') {
            delete store[id];
            return { success: true, id };
        }
        throw new Error(`Unexpected call ${method} ${endPoint}`);
    };

    const createContext = (messages, id = 'each-run-1') => {
        const context = createMockContext({ id, messages, properties: {} });
        context.flowId = 'flow-1';
        context.componentId = 'each-1';
        context.log = sinon.stub();
        context.getWebhookUrl = sinon.stub().returns(WEBHOOK_URL);
        context.callAppmixer = sinon.spy(callAppmixer);
        context.stateGet = sinon.spy(async key => state[key]);
        context.stateSet = sinon.spy(async (key, value) => { state[key] = value; });
        context.stateUnset = sinon.spy(async key => { delete state[key]; });
        context.sendJson = sinon.spy(async (content, port) => { sent.push({ content, port }); });
        context.setTimeout = sinon.spy(async (content, ms) => {
            const timeoutId = `timeout-${timeouts.length}`;
            timeouts.push({ timeoutId, content, ms });
            return timeoutId;
        });
        context.clearTimeout = sinon.spy(async timeoutId => { cleared.push(timeoutId); });
        return context;
    };

    return {
        state, store, sent, timeouts, cleared, triggered,
        start: (content, id) => Each.receive(createContext({ in: { content } }, id)),
        // The webhook delivery runs in a NEW context (a different context.id), like in the engine.
        ack: (id, index) => Each.receive(createContext({ webhook: { content: { data: { id, index } } } }, 'webhook-ctx')),
        timeout: content => Each.receive(createContext({ timeout: { content } }, 'timeout-ctx')),
        createContext,
        items: () => sent.filter(m => m.port === 'item').map(m => m.content),
        dones: () => sent.filter(m => m.port === 'done').map(m => m.content)
    };
}

describe('Each Component - sequential mode', () => {

    afterEach(() => {
        sinon.restore();
    });

    it('should emit only the first item and wait', async () => {
        const h = createHarness();

        await h.start({ list: ['a', 'b', 'c'], sequential: true });

        assert.deepStrictEqual(h.items(), [
            { index: 0, value: 'a', count: 3, correlationId: 'each-run-1' }
        ]);
        assert.strictEqual(h.dones().length, 0);

        // The list and everything needed to wake this component up is parked in the plugin store.
        const record = h.store['each-run-1'];
        assert.strictEqual(record.sequential, true);
        assert.deepStrictEqual(record.items, ['a', 'b', 'c']);
        assert.strictEqual(record.flowId, 'flow-1');
        assert.strictEqual(record.componentId, 'each-1');
        // All three are needed by the engine to restore the scope of the original message.
        assert.deepStrictEqual(record.webhookQuery, {
            correlationId: 'corr-1',
            correlationInPort: 'in',
            messageId: 'msg-1'
        });

        assert.deepStrictEqual(h.state['each-run-1'], { index: 0, timeoutId: 'timeout-0' });
        assert.deepStrictEqual(h.timeouts[0].content, { id: 'each-run-1', sequential: true, index: 0 });
        // Default item timeout: 300 s.
        assert.strictEqual(h.timeouts[0].ms, 300000);
    });

    it('should emit the next item on each acknowledgement and done after the last one', async () => {
        const h = createHarness();

        await h.start({ list: ['a', 'b', 'c'], sequential: true });
        await h.ack('each-run-1', 0);
        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b']);
        assert.strictEqual(h.dones().length, 0);

        await h.ack('each-run-1', 1);
        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b', 'c']);
        assert.strictEqual(h.dones().length, 0);

        await h.ack('each-run-1', 2);
        assert.deepStrictEqual(h.items().map(i => i.index), [0, 1, 2]);
        assert.deepStrictEqual(h.dones(), [{ count: 3, correlationId: 'each-run-1' }]);

        // Every pending item timeout was cleared and nothing is left behind.
        assert.deepStrictEqual(h.cleared, ['timeout-0', 'timeout-1', 'timeout-2']);
        assert.strictEqual(h.store['each-run-1'], undefined);
        assert.strictEqual(h.state['each-run-1'], undefined);
    });

    it('should ignore a duplicated acknowledgement (fan-out into two ContinueEach, re-delivery)', async () => {
        const h = createHarness();

        await h.start({ list: ['a', 'b', 'c'], sequential: true });
        await h.ack('each-run-1', 0);
        await h.ack('each-run-1', 0);

        // Still exactly one item in flight: 'b'. A second 'c' would break the ordering guarantee.
        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b']);
        assert.strictEqual(h.state['each-run-1'].index, 1);
    });

    it('should move on when an item is not acknowledged in time, and ignore its late acknowledgement', async () => {
        const h = createHarness();

        await h.start({ list: ['a', 'b', 'c'], sequential: true, itemTimeout: 120 });
        assert.strictEqual(h.timeouts[0].ms, 120000);

        await h.timeout(h.timeouts[0].content);
        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b']);

        // The slow branch of item 0 finally reaches ContinueEach - 'b' is in flight, nothing happens.
        await h.ack('each-run-1', 0);
        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b']);

        // A stale timeout (item 0 again) is ignored too.
        await h.timeout(h.timeouts[0].content);
        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b']);
    });

    it('should send done after the last item times out', async () => {
        const h = createHarness();

        await h.start({ list: ['a'], sequential: true });
        await h.timeout(h.timeouts[0].content);

        assert.deepStrictEqual(h.dones(), [{ count: 1, correlationId: 'each-run-1' }]);
        assert.strictEqual(h.store['each-run-1'], undefined);
    });

    it('should send done right away for an empty list', async () => {
        const h = createHarness();

        await h.start({ list: [], sequential: true });

        assert.strictEqual(h.items().length, 0);
        assert.deepStrictEqual(h.dones(), [{ count: 0, correlationId: 'each-run-1' }]);
        assert.deepStrictEqual(h.store, {});
        assert.strictEqual(h.timeouts.length, 0);
    });

    it('should not restart a running loop when the engine re-delivers `in`', async () => {
        const h = createHarness();
        const content = { list: ['a', 'b', 'c'], sequential: true };

        await h.start(content);
        await h.ack('each-run-1', 0);
        // Same context.id => same loop.
        await h.start(content);

        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b']);
        assert.strictEqual(h.state['each-run-1'].index, 1);
    });

    it('should keep concurrent loops of the same component apart', async () => {
        const h = createHarness();

        await h.start({ list: ['a1', 'a2'], sequential: true }, 'run-a');
        await h.start({ list: ['b1', 'b2'], sequential: true }, 'run-b');
        await h.ack('run-b', 0);

        assert.deepStrictEqual(h.items().map(i => i.value), ['a1', 'b1', 'b2']);
        assert.strictEqual(h.state['run-a'].index, 0);
        assert.strictEqual(h.state['run-b'].index, 1);
    });

    it('should ignore a malformed or unknown acknowledgement', async () => {
        const h = createHarness();

        await h.start({ list: ['a', 'b'], sequential: true });
        await h.ack(undefined, 0);
        await h.ack('each-run-1', 'not-a-number');
        await h.ack('each-run-1', -1);
        await h.ack('unknown-run', 0);

        assert.deepStrictEqual(h.items().map(i => i.value), ['a']);
    });

    it('should reject an item timeout below one minute (the engine would silently round it up)', async () => {
        for (const bad of [10, -1, 'foo', NaN]) {
            const h = createHarness();
            const context = h.createContext({ in: { content: { list: ['a'], sequential: true, itemTimeout: bad } } });

            await assert.rejects(
                async () => Each.receive(context),
                err => err instanceof context.CancelError && err.message.includes('itemTimeout')
            );
            assert.strictEqual(h.items().length, 0);
        }
    });

    it('should apply the delay before each next item, but not before the first one or done', async () => {
        const h = createHarness();
        const delay = 60;
        const elapsed = async fn => {
            const startedAt = Date.now();
            await fn();
            return Date.now() - startedAt;
        };

        const startTook = await elapsed(() => h.start({ list: ['a', 'b'], sequential: true, delay }));
        assert.deepStrictEqual(h.items().map(i => i.value), ['a']);
        assert.ok(startTook < delay, `no delay before the first item, took ${startTook} ms`);

        const nextTook = await elapsed(() => h.ack('each-run-1', 0));
        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b']);
        // Timers may fire a millisecond early.
        assert.ok(nextTook >= delay - 5, `the next item waits for the delay, took ${nextTook} ms`);

        const doneTook = await elapsed(() => h.ack('each-run-1', 1));
        assert.strictEqual(h.dones().length, 1);
        assert.ok(doneTook < delay, `no delay before done, took ${doneTook} ms`);
    });

    it('should leave the non-sequential paths untouched', async () => {
        const h = createHarness();

        await h.start({ list: ['a', 'b', 'c'] });

        assert.deepStrictEqual(h.items().map(i => i.value), ['a', 'b', 'c']);
        assert.strictEqual(h.dones().length, 1);
        assert.deepStrictEqual(h.store, {});
    });

    it('should keep the order with a loop body of random latency (the reported problem)', async () => {
        const h = createHarness();
        const list = Array.from({ length: 25 }, (_, i) => `item-${i}`);
        const processed = [];
        let inFlight = 0;
        let maxInFlight = 0;

        // The loop body: take whatever Each emitted last, "work" for a random time, then acknowledge
        // through the real ContinueEach component.
        const runBody = async item => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 8)));
            processed.push(item.value);
            inFlight--;

            const { correlationId, index } = item;
            await ContinueEach.receive(h.createContext({ in: { content: { correlationId, index } } }));
        };

        await h.start({ list, sequential: true });

        let handled = 0;
        while (h.dones().length === 0) {
            const items = h.items();
            assert.ok(handled < items.length, 'the loop stalled');
            await runBody(items[handled++]);
            // ContinueEach went through the plugin route, which wakes Each up on its webhook port.
            const { id, index, query } = h.triggered[h.triggered.length - 1];
            assert.strictEqual(query.messageId, 'msg-1');
            await h.ack(id, index);
        }

        assert.deepStrictEqual(processed, list);
        assert.strictEqual(maxInFlight, 1);
    });
});

describe('ContinueEach Component', () => {

    afterEach(() => {
        sinon.restore();
    });

    const createContext = (content, result = { success: true }) => {
        const context = createMockContext({ messages: { in: { content } }, properties: {} });
        context.log = sinon.stub();
        context.callAppmixer = sinon.stub().resolves(result);
        return context;
    };

    it('should acknowledge the item through the plugin and pass the ids on', async () => {
        const context = createContext({ correlationId: 'run:1/x', index: '2' });

        await ContinueEach.receive(context);

        assert.deepStrictEqual(context.callAppmixer.getCall(0).args[0], {
            endPoint: '/plugins/appmixer/utils/controls/run%3A1%2Fx/next',
            method: 'POST',
            body: { index: 2 }
        });
        assert.ok(context.sendJson.calledOnceWith({ correlationId: 'run:1/x', index: 2 }, 'out'));
    });

    it('should accept index 0', async () => {
        const context = createContext({ correlationId: 'run-1', index: 0 });

        await ContinueEach.receive(context);

        assert.strictEqual(context.callAppmixer.getCall(0).args[0].body.index, 0);
    });

    it('should continue the flow when no loop is waiting', async () => {
        const context = createContext({ correlationId: 'run-1', index: 1 }, { success: false, error: 'Not found' });

        await ContinueEach.receive(context);

        assert.ok(context.log.calledOnce);
        assert.ok(context.sendJson.calledOnceWith({ correlationId: 'run-1', index: 1 }, 'out'));
    });

    it('should throw CancelError without a Correlation ID', async () => {
        const context = createContext({ index: 1 });

        await assert.rejects(
            async () => ContinueEach.receive(context),
            err => err instanceof context.CancelError && err.message.includes('Correlation ID')
        );
        assert.ok(context.callAppmixer.notCalled);
    });

    it('should throw CancelError for a missing or invalid index', async () => {
        for (const bad of [undefined, null, '', 'foo', -1, 1.5]) {
            const context = createContext({ correlationId: 'run-1', index: bad });

            await assert.rejects(
                async () => ContinueEach.receive(context),
                err => err instanceof context.CancelError && err.message.includes('Index')
            );
            assert.ok(context.callAppmixer.notCalled);
        }
    });
});
