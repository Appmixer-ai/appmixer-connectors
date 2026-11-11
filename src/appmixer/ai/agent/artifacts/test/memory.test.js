'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const memory = require('../../memory');

const user = (text) => ({ role: 'user', content: text });
const assistant = (text) => ({ role: 'assistant', content: [{ type: 'text', text }] });
const toolCall = (id) => ({
    role: 'assistant',
    content: [{ type: 'tool-call', toolCallId: id, toolName: 'search', args: { q: 'x' } }]
});
const toolResult = (id, result = 'ok') => ({
    role: 'tool',
    content: [{ type: 'tool-result', toolCallId: id, toolName: 'search', result }]
});

// Roughly `n` tokens of text.
const words = (n) => Array.from({ length: n }, (_, i) => `word${i % 7}`).join(' ');

function createContext(config = {}) {

    const context = createMockContext({});
    context.config = config;
    context.log = sinon.stub().resolves();
    context.flowId = 'flow-1';
    const records = {};
    context.store = {
        get: sinon.stub().callsFake(async (storeId, key) => records[`${storeId}/${key}`] || null),
        set: sinon.stub().callsFake(async (storeId, key, value) => {
            records[`${storeId}/${key}`] = { key, value };
        })
    };
    context.records = records;
    return context;
}

describe('ai.agent memory', () => {

    describe('sanitizeMessage', () => {

        it('replaces image and file parts with a text placeholder', () => {

            const message = {
                role: 'user',
                content: [
                    { type: 'image', image: Buffer.from('binary'), mimeType: 'image/png' },
                    { type: 'file', data: Buffer.from('binary'), mimeType: 'application/pdf' },
                    { type: 'text', text: 'What is this?' }
                ]
            };
            const sanitized = memory.sanitizeMessage(message);

            assert.deepStrictEqual(sanitized.content, [
                { type: 'text', text: '[Attached image (image/png)]' },
                { type: 'text', text: '[Attached file (application/pdf)]' },
                { type: 'text', text: 'What is this?' }
            ]);
            // The original still carries the binary for the model call.
            assert.strictEqual(message.content[0].type, 'image');
        });

        it('truncates oversized tool results and text, and leaves small ones alone', () => {

            const big = { rows: 'x'.repeat(500) };
            const sanitized = memory.sanitizeMessage(toolResult('1', big), 100);
            const part = sanitized.content[0];
            assert.strictEqual(typeof part.result, 'string');
            assert.ok(part.result.length < 200);
            assert.match(part.result, /\[truncated \d+ characters\]$/);
            assert.strictEqual(part.toolCallId, '1');

            const small = toolResult('2', { ok: true });
            assert.deepStrictEqual(memory.sanitizeMessage(small, 100), small);

            assert.match(memory.sanitizeMessage(user('y'.repeat(300)), 100).content, /\[truncated 200 characters\]$/);
        });
    });

    describe('splitMessagesByTokenBudget', () => {

        it('keeps everything when it fits', () => {

            const messages = [user('hi'), assistant('hello'), user('bye'), assistant('goodbye')];
            const { old, recent } = memory.splitMessagesByTokenBudget(messages, 1000);
            assert.deepStrictEqual(old, []);
            assert.deepStrictEqual(recent, messages);
        });

        it('cuts on a turn boundary, never between a tool call and its result', () => {

            const turn1 = [user(words(50)), toolCall('a'), toolResult('a', words(50)), assistant(words(50))];
            const turn2 = [user(words(50)), toolCall('b'), toolResult('b', words(50)), assistant(words(50))];
            const turn3 = [user('short question'), assistant('short answer')];
            const messages = [...turn1, ...turn2, ...turn3];

            for (let budget = 10; budget < 700; budget += 10) {
                const { old, recent } = memory.splitMessagesByTokenBudget(messages, budget);
                assert.deepStrictEqual([...old, ...recent], messages);
                assert.strictEqual(recent[0].role, 'user', `budget ${budget}: recent must start with a user message`);
                assert.ok([0, turn1.length, turn1.length + turn2.length].includes(old.length));
            }
        });

        it('always keeps the newest turn, even when it alone exceeds the budget', () => {

            const messages = [user('first'), assistant('reply'), user(words(500)), assistant(words(500))];
            const { old, recent } = memory.splitMessagesByTokenBudget(messages, 10);
            assert.strictEqual(old.length, 2);
            assert.strictEqual(recent.length, 2);
        });

        it('splits memory without user messages between assistant messages', () => {

            const messages = [
                toolCall('a'), toolResult('a', words(50)), assistant(words(50)),
                toolCall('b'), toolResult('b', words(50)), assistant(words(50)),
                assistant('last')
            ];
            const { old, recent } = memory.splitMessagesByTokenBudget(messages, 200);
            assert.ok(old.length > 0);
            assert.notStrictEqual(recent[0].role, 'tool');
            assert.notStrictEqual(old[old.length - 1].content[0].type, 'tool-call');
        });
    });

    describe('compactMemory', () => {

        const turns = (count, size) => Array.from({ length: count }, (_, i) => [
            user(`question ${i} ${words(size)}`),
            assistant(`answer ${i} ${words(size)}`)
        ]).flat();

        it('does not summarize while under the budget', async () => {

            const context = createContext({ MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 10000 });
            const summarize = sinon.stub().resolves('summary');
            const messages = turns(3, 20);
            const result = await memory.compactMemory(context, { summary: '', messages }, { summarize });

            assert.strictEqual(result.compacted, false);
            assert.deepStrictEqual(result.messages, messages);
            sinon.assert.notCalled(summarize);
        });

        it('compacts down to the target, so the following turns need no summarization', async () => {

            const context = createContext({ MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 2000 });
            const summarize = sinon.stub().resolves('short summary');
            let memoryData = { summary: 'previous', messages: turns(12, 100) };

            const result = await memory.compactMemory(context, memoryData, { summarize });
            assert.strictEqual(result.compacted, true);
            assert.strictEqual(result.summary, 'short summary');
            assert.strictEqual(result.messages[0].role, 'user');
            const keptTokens = result.messages.reduce((sum, m) => sum + memory.countMessageTokens(m), 0);
            assert.ok(keptTokens <= 1000, `kept ${keptTokens} tokens`);
            // The summarizer got the previous summary and exactly the dropped messages.
            const [, oldSummary, oldMessages] = summarize.firstCall.args;
            assert.strictEqual(oldSummary, 'previous');
            assert.deepStrictEqual([...oldMessages, ...result.messages], memoryData.messages);

            // The next turns stay under the budget.
            memoryData = { summary: result.summary, messages: result.messages };
            for (let i = 0; i < 2; i++) {
                memoryData.messages = memoryData.messages.concat(turns(1, 100));
                const next = await memory.compactMemory(context, memoryData, { summarize });
                assert.strictEqual(next.compacted, false);
            }
            sinon.assert.calledOnce(summarize);
        });

        it('counts the summary against the budget', async () => {

            const context = createContext({ MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 1000 });
            const summarize = sinon.stub().resolves('new');
            const messages = turns(4, 50);
            const withoutSummary = await memory.compactMemory(context, { summary: '', messages }, { summarize });
            assert.strictEqual(withoutSummary.compacted, false);

            const withSummary = await memory.compactMemory(context, { summary: words(900), messages }, { summarize });
            assert.strictEqual(withSummary.compacted, true);
        });

        it('keeps the history when summarization fails', async () => {

            const context = createContext({ MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 2000 });
            const summarize = sinon.stub().rejects(new Error('model down'));
            const messages = turns(8, 100);
            const result = await memory.compactMemory(context, { summary: 'previous', messages }, { summarize });

            assert.strictEqual(result.compacted, false);
            assert.strictEqual(result.summary, 'previous');
            assert.deepStrictEqual(result.messages, messages);
            assert.strictEqual(context.log.lastCall.args[0].step, 'memory-summarization-error');
        });

        it('drops the oldest turns when summarization fails and the memory is twice over budget', async () => {

            const context = createContext({ MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 2000 });
            const summarize = sinon.stub().rejects(new Error('model down'));
            const messages = turns(30, 100);
            const result = await memory.compactMemory(context, { summary: 'previous', messages }, { summarize });

            assert.strictEqual(result.compacted, true);
            assert.strictEqual(result.summary, 'previous');
            assert.ok(result.messages.length < messages.length);
            assert.strictEqual(result.messages[0].role, 'user');
        });

        it('does not summarize a single oversized turn', async () => {

            const context = createContext({ MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 100 });
            const summarize = sinon.stub().resolves('summary');
            const messages = [user(words(300)), assistant(words(300))];
            const result = await memory.compactMemory(context, { summary: '', messages }, { summarize });

            assert.strictEqual(result.compacted, false);
            sinon.assert.notCalled(summarize);
        });
    });

    describe('loadMemory / saveMemory / appendMessages', () => {

        it('round-trips through component state', async () => {

            const context = createContext();
            const messages = [user('hi'), assistant('hello')];
            await memory.saveMemory(context, null, 't1', { summary: 's', messages });
            assert.deepStrictEqual(await memory.loadMemory(context, null, 't1'), { summary: 's', messages });
        });

        it('round-trips through a data store', async () => {

            const context = createContext();
            const messages = [user('hi'), assistant('hello')];
            await memory.saveMemory(context, 'store-1', 't1', { summary: '', messages });
            assert.deepStrictEqual(await memory.loadMemory(context, 'store-1', 't1'), { summary: '', messages });
            sinon.assert.notCalled(context.stateSet);
        });

        it('returns an empty memory for a missing or corrupted record', async () => {

            const context = createContext();
            assert.deepStrictEqual(await memory.loadMemory(context, 'store-1', 'none'), { summary: '', messages: [] });
            assert.deepStrictEqual(await memory.loadMemory(context, null, 'none'), { summary: '', messages: [] });

            await context.stateSet('agent_memory_bad', '{not json');
            assert.deepStrictEqual(await memory.loadMemory(context, null, 'bad'), { summary: '', messages: [] });

            await context.stateSet('agent_memory_shape', JSON.stringify({ summary: 5, messages: 'x' }));
            assert.deepStrictEqual(await memory.loadMemory(context, null, 'shape'), { summary: '', messages: [] });
        });

        it('saves sanitized messages and the compacted memory', async () => {

            const context = createContext({ MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 600, MEMORY_MAX_CONTENT_CHARS: 50 });
            const summarize = sinon.stub().resolves('the summary');
            const messages = [
                user(words(300)), assistant(words(300)),
                user(words(300)), assistant(words(300)),
                { role: 'user', content: [{ type: 'image', image: Buffer.alloc(4096) }, { type: 'text', text: 'see' }] },
                assistant('done')
            ];
            const saved = await memory.saveMemory(context, null, 't1', { summary: '', messages }, { summarize });

            assert.deepStrictEqual(await memory.loadMemory(context, null, 't1'), saved);
            assert.ok(JSON.stringify(saved).length < 2000);
            assert.ok(!JSON.stringify(saved).includes('Buffer'));
        });

        it('appends the raw turn to the data store only', async () => {

            const context = createContext();
            const turn = [user('hi'), assistant('hello')];

            await memory.appendMessages(context, null, 't1', turn);
            sinon.assert.notCalled(context.stateSet);
            sinon.assert.notCalled(context.store.set);

            await memory.appendMessages(context, 'store-1', 't1', turn);
            await memory.appendMessages(context, 'store-1', 't1', turn);
            const keys = context.store.set.getCalls().map(call => call.args[1]);
            assert.strictEqual(new Set(keys).size, 2);
            keys.forEach(key => assert.match(key, /^agent_messages_t1_\d+_[0-9a-f]{8}$/));
            assert.deepStrictEqual(JSON.parse(context.store.set.firstCall.args[2]), turn);
        });
    });

    describe('lockThread', () => {

        it('locks per store and thread, or per component and thread without a store', async () => {

            const context = createContext();
            await memory.lockThread(context, 'store-1', 't1');
            await memory.lockThread(context, null, 't1');

            assert.strictEqual(context.lock.firstCall.args[0], 'agent_memory:store-1:t1');
            assert.strictEqual(context.lock.secondCall.args[0], `agent_memory:flow-1:${context.componentId}:t1`);
            const options = context.lock.firstCall.args[1];
            assert.ok(options.ttl >= 60000);
            assert.ok(options.retryDelay * options.maxRetryCount >= options.ttl);
        });
    });
});
