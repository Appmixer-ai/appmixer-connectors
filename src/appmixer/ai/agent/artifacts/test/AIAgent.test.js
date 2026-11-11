'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { MockLanguageModelV1 } = require('ai/test');
const { createMockContext } = require('../../../../../../test/utils');

const provider = require('../../provider');
const componentTool = require('../../tool');
const lib = require('../../lib');
const AIAgent = require('../../AIAgent/AIAgent');

describe('ai.agent AIAgent memory', () => {

    let sandbox;
    let modelCalls;
    let events;

    function createModel(answer) {

        return new MockLanguageModelV1({
            doGenerate: async (options) => {
                modelCalls.push(options.prompt);
                return {
                    rawCall: { rawPrompt: null, rawSettings: {} },
                    finishReason: 'stop',
                    usage: { promptTokens: 10, completionTokens: 5 },
                    text: typeof answer === 'function' ? answer(options) : answer
                };
            }
        });
    }

    function createContext(content, config = {}) {

        const context = createMockContext({});
        context.config = config;
        context.flowId = 'flow-1';
        context.properties = { model: 'mock-model', instructions: 'Be brief.' };
        context.messages = { in: { content } };
        context.log = sinon.stub().resolves();
        context.sendJson = sinon.stub().callsFake(async () => { events.push('send'); });
        const unlock = sinon.stub().callsFake(async () => { events.push('unlock'); });
        context.lock = sinon.stub().callsFake(async () => {
            events.push('lock');
            return { unlock };
        });
        const originalStateSet = context.stateSet;
        context.stateSet = sinon.stub().callsFake(async (key, value) => {
            if (key.startsWith('agent_memory_')) events.push('save');
            return originalStateSet(key, value);
        });
        return context;
    }

    const systemText = (prompt) => prompt.filter(m => m.role === 'system').map(m => m.content).join('\n');
    const userTexts = (prompt) => prompt
        .filter(m => m.role === 'user')
        .map(m => m.content.map(part => part.text).join(''));

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        modelCalls = [];
        events = [];
        sandbox.stub(componentTool, 'buildComponentToolDefs').resolves({});
        sandbox.stub(componentTool, 'buildComponentVercelTools').returns({});
        sandbox.stub(lib, 'publishChatProgressEvent').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('remembers the user messages of earlier turns', async () => {

        sandbox.stub(provider, 'createModel').callsFake(() => createModel('The answer.'));
        const context = createContext({ prompt: 'My name is Ada.', threadId: 't1' });

        await AIAgent.receive(context);
        context.messages.in.content = { prompt: 'What is my name?', threadId: 't1' };
        await AIAgent.receive(context);

        assert.deepStrictEqual(userTexts(modelCalls[1]), ['My name is Ada.', 'What is my name?']);
        assert.strictEqual(modelCalls[1].filter(m => m.role === 'assistant').length, 1);

        const saved = JSON.parse(await context.stateGet('agent_memory_t1'));
        assert.deepStrictEqual(saved.messages.map(m => m.role), ['user', 'assistant', 'user', 'assistant']);
        assert.strictEqual(context.sendJson.firstCall.args[0].answer, 'The answer.');
    });

    it('sends the answer before saving the memory, all under the thread lock', async () => {

        sandbox.stub(provider, 'createModel').callsFake(() => createModel('ok'));
        const context = createContext({ prompt: 'Hello', threadId: 't1' });

        await AIAgent.receive(context);

        assert.deepStrictEqual(events, ['lock', 'send', 'save', 'unlock']);
    });

    it('does not lock or save without a thread', async () => {

        sandbox.stub(provider, 'createModel').callsFake(() => createModel('ok'));
        const context = createContext({ prompt: 'Hello' });

        await AIAgent.receive(context);

        assert.deepStrictEqual(events, ['send']);
    });

    it('releases the lock when the agent fails', async () => {

        sandbox.stub(provider, 'createModel').callsFake(() => createModel(() => {
            throw new Error('model down');
        }));
        const context = createContext({ prompt: 'Hello', threadId: 't1' });

        await assert.rejects(AIAgent.receive(context), /model down/);
        assert.deepStrictEqual(events, ['lock', 'unlock']);
    });

    it('still answers when saving the memory fails', async () => {

        sandbox.stub(provider, 'createModel').callsFake(() => createModel('ok'));
        const context = createContext({ prompt: 'Hello', threadId: 't1' });
        context.stateSet = sinon.stub().callsFake(async (key) => {
            if (key.startsWith('agent_memory_')) throw new Error('state unavailable');
        });

        await AIAgent.receive(context);

        sinon.assert.calledOnce(context.sendJson);
        assert.ok(context.log.getCalls().some(call => call.args[0].step === 'memory-save-error'));
    });

    it('summarizes old turns once over budget and passes the summary in the system prompt', async () => {

        // The summarization call is recognised by its system prompt.
        const isSummaryCall = (options) => /memory summary/.test(systemText(options.prompt));
        sandbox.stub(provider, 'createModel').callsFake(() => createModel(
            options => (isSummaryCall(options) ? 'SUMMARY: the user is Ada.' : 'A reply that is long enough to count.')
        ));
        const context = createContext({}, { MEMORY_RECENT_MESSAGES_TOKEN_BUDGET: 120 });

        for (let i = 0; i < 8; i++) {
            context.messages.in.content = {
                prompt: `Question number ${i} about a fairly long topic to use up tokens.`,
                threadId: 't1'
            };
            await AIAgent.receive(context);
        }

        const summaryCalls = modelCalls.filter(prompt => isSummaryCall({ prompt }));
        assert.ok(summaryCalls.length >= 1, 'expected a summarization');
        assert.ok(summaryCalls.length < 6, `summarized on ${summaryCalls.length} of 8 turns`);

        const saved = JSON.parse(await context.stateGet('agent_memory_t1'));
        assert.strictEqual(saved.summary, 'SUMMARY: the user is Ada.');
        assert.strictEqual(saved.messages[0].role, 'user');
        assert.ok(saved.messages.length < 16);

        // A later agent call carries the summary in its (single) system message.
        const lastAgentCall = modelCalls.filter(prompt => !isSummaryCall({ prompt })).pop();
        const systemMessages = lastAgentCall.filter(m => m.role === 'system');
        assert.strictEqual(systemMessages.length, 1);
        assert.match(systemMessages[0].content, /^Be brief\./);
        assert.match(systemMessages[0].content, /SUMMARY: the user is Ada\./);
    });
});
