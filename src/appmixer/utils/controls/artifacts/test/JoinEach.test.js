'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const JoinEach = require('../../JoinEach/JoinEach');

/**
 * A minimal stand-in for the engine around JoinEach components of one flow: component state is per
 * component, flow state is shared by every component of the flow.
 */
function createHarness() {

    const flowState = {};
    const componentStates = {};
    const sent = [];
    const timeouts = [];
    const cleared = [];

    const createContext = (messages, componentId = 'join-1') => {
        const state = componentStates[componentId] = componentStates[componentId] || {};
        const context = createMockContext({ messages, properties: {} });
        context.componentId = componentId;
        context.lock = sinon.stub().resolves({ unlock: sinon.stub() });
        context.stateGet = sinon.spy(async key => state[key]);
        context.stateSet = sinon.spy(async (key, value) => { state[key] = value; });
        context.stateUnset = sinon.spy(async key => { delete state[key]; });
        context.flow = {
            stateGet: sinon.spy(async key => flowState[key]),
            stateSet: sinon.spy(async (key, value) => { flowState[key] = JSON.parse(JSON.stringify(value)); }),
            stateUnset: sinon.spy(async key => { delete flowState[key]; })
        };
        context.sendJson = sinon.spy(async (content, port) => { sent.push({ componentId, content, port }); });
        context.setTimeout = sinon.spy(async content => {
            const timeoutId = `timeout-${timeouts.length}`;
            timeouts.push({ timeoutId, content });
            return timeoutId;
        });
        context.clearTimeout = sinon.spy(async timeoutId => { cleared.push(timeoutId); });
        return context;
    };

    return {
        flowState, componentStates, sent, timeouts, cleared,
        in: (correlationId, item, componentId) => JoinEach.receive(createContext({
            in: { content: { correlationId }, originalContent: { item } }
        }, componentId)),
        count: (correlationId, count, componentId, timeout = true) => JoinEach.receive(createContext({
            count: { content: { correlationId, count, timeout, timeoutValue: 300 } }
        }, componentId)),
        timeout: (correlationId, componentId) => JoinEach.receive(createContext({
            timeout: { content: { correlationId } }
        }, componentId)),
        outs: port => sent.filter(m => m.port === port)
    };
}

describe('JoinEach Component', () => {

    afterEach(() => {
        sinon.restore();
    });

    it('should join the messages when the count arrives first', async () => {
        const h = createHarness();

        await h.count('c1', 2);
        await h.in('c1', 'a');
        assert.strictEqual(h.outs('out').length, 0);
        await h.in('c1', 'b');

        assert.deepStrictEqual(h.outs('out').map(m => m.content), [{ items: [{ item: 'a' }, { item: 'b' }] }]);
        assert.deepStrictEqual(h.cleared, ['timeout-0']);
        assert.deepStrictEqual(h.flowState, {});
        assert.deepStrictEqual(h.componentStates['join-1'], {});
    });

    it('should join the messages when the count arrives last', async () => {
        const h = createHarness();

        await h.in('c1', 'a');
        await h.in('c1', 'b');
        await h.count('c1', 2);

        assert.deepStrictEqual(h.outs('out').map(m => m.content), [{ items: [{ item: 'a' }, { item: 'b' }] }]);
        assert.strictEqual(h.timeouts.length, 0);
        assert.deepStrictEqual(h.flowState, {});
    });

    it('should send right away for a count of 0', async () => {
        const h = createHarness();

        await h.count('c1', 0);

        assert.deepStrictEqual(h.outs('out').map(m => m.content), [{ items: [] }]);
        assert.deepStrictEqual(h.flowState, {});
    });

    it('should send what arrived to the timeout port', async () => {
        const h = createHarness();

        await h.count('c1', 3);
        await h.in('c1', 'a');
        await h.timeout('c1');

        assert.deepStrictEqual(h.outs('timeout').map(m => m.content), [{ items: [{ item: 'a' }], count: 3, arrived: 1 }]);
        assert.deepStrictEqual(h.flowState, {});
    });

    it('should ignore a timeout of a join that already finished', async () => {
        const h = createHarness();

        await h.count('c1', 1);
        await h.in('c1', 'a');
        await h.timeout('c1');

        assert.strictEqual(h.outs('out').length, 1);
        assert.strictEqual(h.outs('timeout').length, 0);
        assert.deepStrictEqual(h.flowState, {});
    });

    it('should keep many joins in progress out of the component state (#3159)', async function() {
        // Hundreds of acknowledgements through sinon spies: a busy CI runner needs more than mocha's 2 s.
        this.timeout(15000);
        const h = createHarness();
        const joins = Array.from({ length: 20 }, (_, i) => `c${i}`);

        for (const cid of joins) {
            await h.count(cid, 10);
        }
        for (let i = 0; i < 10; i++) {
            for (const cid of joins) {
                assert.deepStrictEqual(h.componentStates['join-1'], {}, 'nothing in the component state');
                await h.in(cid, `${cid}-${i}`);
            }
        }

        assert.strictEqual(h.outs('out').length, joins.length);
        h.outs('out').forEach(m => assert.strictEqual(m.content.items.length, 10));
        assert.deepStrictEqual(h.flowState, {});
    });

    it('should keep two JoinEach components of one flow apart on the same correlation ID', async () => {
        const h = createHarness();

        await h.count('c1', 2, 'join-1');
        await h.count('c1', 1, 'join-2');
        await h.in('c1', 'a', 'join-1');
        await h.in('c1', 'x', 'join-2');

        assert.deepStrictEqual(h.outs('out').map(m => [m.componentId, m.content.items]), [['join-2', [{ item: 'x' }]]]);
        await h.in('c1', 'b', 'join-1');
        assert.deepStrictEqual(h.outs('out').map(m => [m.componentId, m.content.items.length]), [['join-2', 1], ['join-1', 2]]);
        assert.deepStrictEqual(h.flowState, {});
    });

    describe('joins started by JoinEach 1.1.2 (in component state)', () => {

        const seedLegacyJoin = h => {
            h.componentStates['join-1'] = {
                c1: { count: 3, timeoutId: 'timeout-legacy', inputMessages: [{ item: 'a' }] }
            };
        };

        it('should move the join to flow state on the next message and finish it', async () => {
            const h = createHarness();
            seedLegacyJoin(h);

            await h.in('c1', 'b');
            assert.deepStrictEqual(h.componentStates['join-1'], {});
            assert.deepStrictEqual(h.flowState['joineach:join-1:c1'].inputMessages, [{ item: 'a' }, { item: 'b' }]);

            await h.in('c1', 'c');
            assert.deepStrictEqual(h.outs('out').map(m => m.content), [{ items: [{ item: 'a' }, { item: 'b' }, { item: 'c' }] }]);
            assert.deepStrictEqual(h.cleared, ['timeout-legacy']);
            assert.deepStrictEqual(h.flowState, {});
            assert.deepStrictEqual(h.componentStates['join-1'], {});
        });

        it('should handle the timeout the old version set', async () => {
            const h = createHarness();
            seedLegacyJoin(h);

            await h.timeout('c1');

            assert.deepStrictEqual(h.outs('timeout').map(m => m.content), [{ items: [{ item: 'a' }], count: 3, arrived: 1 }]);
            assert.deepStrictEqual(h.flowState, {});
            assert.deepStrictEqual(h.componentStates['join-1'], {});
        });

        it('should merge a message the old version stored while both versions run (upgrade window)', async () => {
            const h = createHarness();
            // New version: the join is in flow state with its count.
            await h.count('c1', 3);
            await h.in('c1', 'a');
            // Old version (another worker, right after the upgrade) did not see it and stored `b`
            // as a new join in component state.
            h.componentStates['join-1'].c1 = { inputMessages: [{ item: 'b' }] };

            await h.in('c1', 'c');

            assert.deepStrictEqual(h.outs('out').map(m => m.content), [{ items: [{ item: 'a' }, { item: 'b' }, { item: 'c' }] }]);
            assert.strictEqual(h.outs('timeout').length, 0);
            assert.deepStrictEqual(h.flowState, {});
            assert.deepStrictEqual(h.componentStates['join-1'], {});
        });

        it('should merge a count the old version stored while both versions run (upgrade window)', async () => {
            const h = createHarness();
            await h.in('c1', 'a');
            // The old version handled `count` and set its timeout in component state.
            h.componentStates['join-1'].c1 = { count: 2, timeoutId: 'timeout-legacy' };

            await h.in('c1', 'b');

            assert.deepStrictEqual(h.outs('out').map(m => m.content), [{ items: [{ item: 'a' }, { item: 'b' }] }]);
            assert.deepStrictEqual(h.cleared, ['timeout-legacy']);
            assert.deepStrictEqual(h.flowState, {});
            assert.deepStrictEqual(h.componentStates['join-1'], {});
        });
    });
});
