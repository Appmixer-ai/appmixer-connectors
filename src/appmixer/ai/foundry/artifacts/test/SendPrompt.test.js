const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../../test/utils.js');
const lib = require('../../lib');
const SendPrompt = require('../../SendPrompt/SendPrompt');

describe('ai/foundry SendPrompt', () => {

    let request;

    afterEach(() => {
        sinon.restore();
    });

    // createMockContext() calls sinon.restore(), so the lib stub is created after the context.
    const contextWith = (content) => {
        const context = testUtils.createMockContext({
            messages: { in: { content } },
            auth: { endpoint: 'https://my-resource.openai.azure.com', apiKey: 'test-api-key' }
        });
        request = sinon.stub(lib, 'request').resolves({ data: { choices: [{ message: { content: 'Hello from Foundry' } }] } });
        return context;
    };

    it('sends the prompt to the deployment and returns the answer', async () => {

        const context = contextWith({ prompt: 'Hello', model: 'gpt-4o-prod' });

        await SendPrompt.receive(context);

        const [, method, endpoint, data] = request.firstCall.args;
        assert.strictEqual(method, 'post');
        assert.strictEqual(endpoint, '/chat/completions');
        assert.strictEqual(data.model, 'gpt-4o-prod');
        assert.strictEqual(data.messages[1].content, 'Hello');
        assert.deepStrictEqual(context.sendJson.firstCall.args, [{ answer: 'Hello from Foundry', prompt: 'Hello' }, 'out']);
    });

    it('coerces sampling inputs, sends the cap as max_completion_tokens and drops the ones that are not set', async () => {

        const context = contextWith({
            prompt: 'Hello',
            model: 'o4-mini',
            instructions: 'Answer tersely.',
            temperature: '0.2',   // bound to a flow variable -> string
            maxTokens: '50.7',
            topP: '',              // left empty in the inspector
            frequencyPenalty: 'abc',
            presencePenalty: 0
        });

        await SendPrompt.receive(context);

        const data = request.firstCall.args[3];
        assert.strictEqual(data.messages[0].content, 'Answer tersely.');
        assert.strictEqual(data.temperature, 0.2);
        assert.strictEqual(data.max_completion_tokens, 50);
        assert.strictEqual('max_tokens' in data, false);
        assert.strictEqual(data.presence_penalty, 0);
        assert.strictEqual('top_p' in data, false);
        assert.strictEqual('frequency_penalty' in data, false);
    });

    it('requires a deployment', async () => {

        await assert.rejects(() => SendPrompt.receive(contextWith({ prompt: 'Hello' })), /Deployment is required/);
        assert.strictEqual(request.callCount, 0);
    });

    it('requires a prompt', async () => {

        await assert.rejects(() => SendPrompt.receive(contextWith({ model: 'gpt-4o-prod' })), /Prompt is required/);
        assert.strictEqual(request.callCount, 0);
    });
});
