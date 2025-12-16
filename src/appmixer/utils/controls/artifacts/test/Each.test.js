'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const Each = require('../../Each/Each');

describe('Each Component', () => {

    afterEach(() => {
        sinon.restore();
    });

    describe('Normal Each (no delay)', () => {

        it('should iterate over array and send each item to output', async () => {
            const context = createMockContext({
                id: 'test-context-id',
                messages: {
                    in: {
                        content: {
                            list: ['apple', 'banana', 'cherry']
                        }
                    }
                },
                properties: {}
            });

            await Each.receive(context);

            // Should send 3 items + 1 done message
            assert.strictEqual(context.sendJson.callCount, 4);

            // Check first item
            const firstCall = context.sendJson.getCall(0);
            assert.strictEqual(firstCall.args[0].index, 0);
            assert.strictEqual(firstCall.args[0].value, 'apple');
            assert.strictEqual(firstCall.args[0].count, 3);
            assert.strictEqual(firstCall.args[1], 'item');

            // Check second item
            const secondCall = context.sendJson.getCall(1);
            assert.strictEqual(secondCall.args[0].index, 1);
            assert.strictEqual(secondCall.args[0].value, 'banana');
            assert.strictEqual(secondCall.args[1], 'item');

            // Check third item
            const thirdCall = context.sendJson.getCall(2);
            assert.strictEqual(thirdCall.args[0].index, 2);
            assert.strictEqual(thirdCall.args[0].value, 'cherry');
            assert.strictEqual(thirdCall.args[1], 'item');

            // Check done message
            const doneCall = context.sendJson.getCall(3);
            assert.strictEqual(doneCall.args[0].count, 3);
            assert.ok(doneCall.args[0].correlationId);
            assert.strictEqual(doneCall.args[1], 'done');

            // Should clean up state
            assert.ok(context.stateUnset.calledWith('test-context-id'));
        });

        it('should handle empty array', async () => {
            const context = createMockContext({
                id: 'test-context-id',
                messages: {
                    in: {
                        content: {
                            list: []
                        }
                    }
                },
                properties: {}
            });

            await Each.receive(context);

            // Should send only done message with count 0
            assert.strictEqual(context.sendJson.callCount, 1);
            const doneCall = context.sendJson.getCall(0);
            assert.strictEqual(doneCall.args[0].count, 0);
            assert.strictEqual(doneCall.args[1], 'done');
        });

        it('should handle JSON string as list input', async () => {
            const context = createMockContext({
                id: 'test-context-id',
                messages: {
                    in: {
                        content: {
                            list: '["one", "two"]'
                        }
                    }
                },
                properties: {}
            });

            await Each.receive(context);

            // Should send 2 items + 1 done message
            assert.strictEqual(context.sendJson.callCount, 3);

            const firstCall = context.sendJson.getCall(0);
            assert.strictEqual(firstCall.args[0].value, 'one');
            assert.strictEqual(firstCall.args[1], 'item');
        });

        it('should include correlationId in all items', async () => {
            const context = createMockContext({
                id: 'test-context-id',
                messages: {
                    in: {
                        content: {
                            list: ['a', 'b']
                        }
                    }
                },
                properties: {}
            });

            await Each.receive(context);

            const firstCorrelationId = context.sendJson.getCall(0).args[0].correlationId;
            const secondCorrelationId = context.sendJson.getCall(1).args[0].correlationId;
            const doneCorrelationId = context.sendJson.getCall(2).args[0].correlationId;

            // All should have the same correlationId
            assert.ok(firstCorrelationId);
            assert.strictEqual(firstCorrelationId, secondCorrelationId);
            assert.strictEqual(firstCorrelationId, doneCorrelationId);
        });
    });

    describe('Delayed Each', () => {

        // Use configurable timeoutIntervalMs for fast tests with small batch sizes
        // With timeoutIntervalMs = 10 and delay = 5, batch size = 10/5 = 2 items

        it('should send first batch and schedule timeout when list exceeds batch size', async () => {
            // With timeoutIntervalMs = 10ms and delay = 5ms, batch size = 2 items
            const largeList = ['a', 'b', 'c', 'd', 'e'];
            const delay = 5;

            const context = createMockContext({
                id: 'test-context-id',
                config: { timeoutIntervalMs: 10 },
                messages: {
                    in: {
                        content: {
                            list: largeList,
                            delay
                        }
                    }
                },
                properties: {}
            });

            context.callAppmixer = sinon.stub().resolves({ success: true });

            await Each.receive(context);

            // Should send first 2 items (batch size = 2)
            const itemCalls = context.sendJson.getCalls().filter(call => call.args[1] === 'item');
            assert.strictEqual(itemCalls.length, 2);

            // Check items are correct
            assert.strictEqual(itemCalls[0].args[0].value, 'a');
            assert.strictEqual(itemCalls[0].args[0].index, 0);
            assert.strictEqual(itemCalls[1].args[0].value, 'b');
            assert.strictEqual(itemCalls[1].args[0].index, 1);

            // Should store list in plugin
            assert.ok(context.callAppmixer.calledOnce);
            const postCall = context.callAppmixer.getCall(0);
            assert.strictEqual(postCall.args[0].method, 'POST');
            assert.strictEqual(postCall.args[0].body.items.length, 5);
            assert.strictEqual(postCall.args[0].body.delay, 5);
            assert.strictEqual(postCall.args[0].body.count, 5);

            // Should store current index in state
            assert.ok(context.stateSet.calledWith('test-context-id', { index: 2 }));

            // Should schedule timeout
            assert.ok(context.setTimeout.calledOnce);
            assert.deepStrictEqual(context.setTimeout.getCall(0).args[0], { id: 'test-context-id' });
        });

        it('should complete immediately if all items fit in first batch', async () => {
            // With timeoutIntervalMs = 100ms and delay = 5ms, batch size = 20 items
            // 3 items easily fits in one batch
            const smallList = ['a', 'b', 'c'];
            const delay = 5;

            const context = createMockContext({
                id: 'test-context-id',
                config: { timeoutIntervalMs: 100 },
                messages: {
                    in: {
                        content: {
                            list: smallList,
                            delay
                        }
                    }
                },
                properties: {}
            });

            context.callAppmixer = sinon.stub().resolves({ success: true });

            await Each.receive(context);

            // Should send all 3 items + done message
            assert.strictEqual(context.sendJson.callCount, 4);

            const itemCalls = context.sendJson.getCalls().filter(call => call.args[1] === 'item');
            assert.strictEqual(itemCalls.length, 3);

            const doneCalls = context.sendJson.getCalls().filter(call => call.args[1] === 'done');
            assert.strictEqual(doneCalls.length, 1);
            assert.strictEqual(doneCalls[0].args[0].count, 3);

            // Should NOT call plugin to store (no need since completed)
            assert.ok(context.callAppmixer.notCalled);

            // Should NOT schedule timeout
            assert.ok(context.setTimeout.notCalled);
        });

        it('should process next batch on timeout and complete when done', async () => {
            // With timeoutIntervalMs = 10ms and delay = 5ms, batch size = 2 items
            const delay = 5;
            const storedData = {
                items: ['a', 'b', 'c', 'd', 'e'],
                delay,
                correlationId: 'test-correlation-id',
                count: 5
            };

            const context = createMockContext({
                id: 'test-context-id',
                config: { timeoutIntervalMs: 10 },
                messages: {
                    timeout: {
                        content: { id: 'test-context-id' }
                    }
                },
                properties: {}
            });

            // Mock stored state - index 4 means we've sent items 0,1,2,3
            context.stateGet = sinon.stub().resolves({ index: 4 });

            // Mock callAppmixer for GET and DELETE
            context.callAppmixer = sinon.stub();
            context.callAppmixer.withArgs(sinon.match({ method: 'GET' })).resolves({ data: storedData });
            context.callAppmixer.withArgs(sinon.match({ method: 'DELETE' })).resolves({ success: true });

            await Each.receive(context);

            // Should send remaining 1 item (e)
            const itemCalls = context.sendJson.getCalls().filter(call => call.args[1] === 'item');
            assert.strictEqual(itemCalls.length, 1);
            assert.strictEqual(itemCalls[0].args[0].value, 'e');
            assert.strictEqual(itemCalls[0].args[0].index, 4);

            // Should send done
            const doneCalls = context.sendJson.getCalls().filter(call => call.args[1] === 'done');
            assert.strictEqual(doneCalls.length, 1);
            assert.strictEqual(doneCalls[0].args[0].count, 5);
            assert.strictEqual(doneCalls[0].args[0].correlationId, 'test-correlation-id');

            // Should delete stored data
            assert.ok(context.callAppmixer.calledWith(sinon.match({ method: 'DELETE' })));

            // Should clean up state
            assert.ok(context.stateUnset.calledWith('test-context-id'));
        });

        it('should schedule next timeout if more items remain after batch', async () => {
            // With timeoutIntervalMs = 10ms and delay = 5ms, batch size = 2 items
            const delay = 5;
            const storedData = {
                items: ['a', 'b', 'c', 'd', 'e', 'f'],
                delay,
                correlationId: 'test-correlation-id',
                count: 6
            };

            const context = createMockContext({
                id: 'test-context-id',
                config: { timeoutIntervalMs: 10 },
                messages: {
                    timeout: {
                        content: { id: 'test-context-id' }
                    }
                },
                properties: {}
            });

            // Starting at index 0
            context.stateGet = sinon.stub().resolves({ index: 0 });

            context.callAppmixer = sinon.stub();
            context.callAppmixer.withArgs(sinon.match({ method: 'GET' })).resolves({ data: storedData });

            await Each.receive(context);

            // Should send batch of 2 items (a, b)
            const itemCalls = context.sendJson.getCalls().filter(call => call.args[1] === 'item');
            assert.strictEqual(itemCalls.length, 2);

            // Should NOT send done yet
            const doneCalls = context.sendJson.getCalls().filter(call => call.args[1] === 'done');
            assert.strictEqual(doneCalls.length, 0);

            // Should update state with new index
            assert.ok(context.stateSet.calledWith('test-context-id', { index: 2 }));

            // Should schedule next timeout
            assert.ok(context.setTimeout.calledOnce);
            assert.deepStrictEqual(context.setTimeout.getCall(0).args[0], { id: 'test-context-id' });
        });
    });
});
