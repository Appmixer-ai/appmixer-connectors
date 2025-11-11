const assert = require('assert');
const testUtils = require('../../../../../../test/utils.js');

describe('ai/openai SendPrompt', () => {
    it('sends prompt and returns answer (happy path)', async () => {
        const sent = [];

        // stub the local lib.request used by the SendPrompt module
        const libPath = require.resolve('../../lib');
        const lib = require(libPath);
        lib.request = async (context, method, endpoint, data) => {
            // validate inputs
            assert.strictEqual(method, 'post');
            assert.strictEqual(endpoint, '/chat/completions');
            assert.strictEqual(data.messages[1].content, 'Hello OpenAI');
            return { data: { choices: [{ message: { content: 'Hello from OpenAI' } }] } };
        };

        // require the component after stubbing the lib so it uses the stubbed function
        const SendPrompt = require('../../SendPrompt/SendPrompt');

        const context = testUtils.createMockContext({
            messages: {
                in: {
                    content: {
                        prompt: 'Hello OpenAI',
                        model: 'gpt-4o'
                    }
                }
            },
            auth: { apiKey: 'test-api-key' },
            // override sendJson to capture outgoing messages
            sendJson: (payload, port) => {
                sent.push({ payload, port });
                return Promise.resolve();
            }
        });

        await SendPrompt.receive(context);
        assert.strictEqual(sent.length, 1);
        assert.deepStrictEqual(sent[0].payload, { answer: 'Hello from OpenAI', prompt: 'Hello OpenAI' });
        assert.strictEqual(sent[0].port, 'out');
    });

    it('throws when prompt is missing', async () => {
        const CancelError = class CancelError extends Error {};
        const SendPrompt = require('../../SendPrompt/SendPrompt');
        try {
            await SendPrompt.receive({ messages: { in: { content: {} } }, sendJson: async () => {}, CancelError });
            assert.fail('expected to throw for missing prompt');
        } catch (err) {
            assert.strictEqual(err.message, 'Prompt is required');
        }
    });
});
