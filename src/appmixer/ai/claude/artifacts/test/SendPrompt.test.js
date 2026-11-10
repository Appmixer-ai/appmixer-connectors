/* eslint-disable camelcase */
const assert = require('assert');
const SendPrompt = require('../../SendPrompt/SendPrompt');

describe('ai/claude SendPrompt', () => {
    it('sends prompt and returns answer (happy path)', async () => {
        const sent = [];

        const context = {
            messages: {
                in: {
                    content: {
                        prompt: 'Hello there',
                        system: 'You are helpful',
                        model: 'claude-1',
                        max_tokens: 50
                    }
                }
            },
            auth: { apiKey: 'test-api-key' },
            httpRequest: async (opts) => {
                // basic verification of request shape
                assert.strictEqual(opts.method, 'POST');
                assert.strictEqual(opts.url, 'https://api.anthropic.com/v1/messages');
                assert.strictEqual(opts.headers['x-api-key'], 'test-api-key');
                // simulate API response shape expected by the code
                return {
                    data: {
                        model: 'claude-1-20250101',
                        stop_reason: 'end_turn',
                        content: [{ type: 'text', text: 'Hi — I am Claude' }],
                        usage: { input_tokens: 12, output_tokens: 6, cache_read_input_tokens: 0 }
                    }
                };
            },
            sendJson: (payload, port) => {
                sent.push({ payload, port });
                return Promise.resolve();
            },
            CancelError: class CancelError extends Error {}
        };

        await SendPrompt.receive(context);

        assert.strictEqual(sent.length, 1);
        assert.deepStrictEqual(sent[0].payload, {
            answer: 'Hi — I am Claude',
            prompt: 'Hello there',
            usage: { input_tokens: 12, output_tokens: 6, cache_read_input_tokens: 0 },
            stop_reason: 'end_turn',
            model: 'claude-1-20250101'
        });
        assert.strictEqual(sent[0].port, 'out');
    });

    const createContext = (response, sent, max_tokens = 2048) => ({
        messages: {
            in: {
                content: {
                    prompt: 'Summarize the news',
                    model: 'claude-sonnet-5-5',
                    max_tokens
                }
            }
        },
        auth: { apiKey: 'test-api-key' },
        httpRequest: async () => ({ data: response }),
        sendJson: (payload, port) => {
            sent.push({ payload, port });
            return Promise.resolve();
        },
        CancelError: class CancelError extends Error {}
    });

    it('returns the text block when a thinking block comes first ([thinking, text])', async () => {
        const sent = [];
        const response = {
            model: 'claude-sonnet-5-5',
            stop_reason: 'end_turn',
            content: [
                { type: 'thinking', thinking: 'The user wants a summary. Let me think.', signature: 'sig' },
                { type: 'text', text: 'Here is the summary.' }
            ],
            usage: { input_tokens: 20, output_tokens: 120 }
        };

        await SendPrompt.receive(createContext(response, sent));

        assert.strictEqual(sent.length, 1);
        assert.strictEqual(sent[0].port, 'out');
        assert.strictEqual(sent[0].payload.answer, 'Here is the summary.');
        assert.strictEqual(sent[0].payload.stop_reason, 'end_turn');
    });

    it('joins all text blocks in order ([text, text])', async () => {
        const sent = [];
        const response = {
            model: 'claude-sonnet-5-5',
            stop_reason: 'end_turn',
            content: [
                { type: 'text', text: 'The meeting moved to Thursday' },
                { type: 'text', text: ' and the budget review to next week.' }
            ],
            usage: { input_tokens: 20, output_tokens: 18 }
        };

        await SendPrompt.receive(createContext(response, sent));

        assert.strictEqual(sent[0].payload.answer, 'The meeting moved to Thursday and the budget review to next week.');
    });

    it('skips non-text blocks between text blocks ([thinking, text, redacted_thinking, text])', async () => {
        const sent = [];
        const response = {
            stop_reason: 'end_turn',
            content: [
                { type: 'thinking', thinking: '...', signature: 'sig' },
                { type: 'text', text: 'A' },
                { type: 'redacted_thinking', data: 'xyz' },
                { type: 'text', text: 'B' }
            ]
        };

        await SendPrompt.receive(createContext(response, sent));

        assert.strictEqual(sent[0].payload.answer, 'AB');
    });

    it('fails with a clear message when Max Tokens is spent on thinking alone', async () => {
        const sent = [];
        const response = {
            model: 'claude-sonnet-5-5',
            stop_reason: 'max_tokens',
            content: [
                { type: 'thinking', thinking: 'Let me think about this carefully...', signature: 'sig' }
            ],
            usage: { input_tokens: 20, output_tokens: 256 }
        };
        const context = createContext(response, sent, 256);

        await assert.rejects(
            () => SendPrompt.receive(context),
            (err) => {
                assert.ok(err instanceof context.CancelError);
                assert.match(err.message, /256 Max Tokens/);
                assert.match(err.message, /max_tokens/);
                assert.match(err.message, /Increase Max Tokens/);
                return true;
            }
        );
        assert.strictEqual(sent.length, 0);
    });

    it('sends the cut-off answer when some text came back before max_tokens', async () => {
        const sent = [];
        const response = {
            stop_reason: 'max_tokens',
            content: [
                { type: 'thinking', thinking: '...', signature: 'sig' },
                { type: 'text', text: 'The answer is cut' }
            ]
        };

        await SendPrompt.receive(createContext(response, sent, 512));

        assert.strictEqual(sent[0].payload.answer, 'The answer is cut');
        assert.strictEqual(sent[0].payload.stop_reason, 'max_tokens');
    });

    it('returns an empty answer for an empty content array that was not cut off', async () => {
        const sent = [];

        await SendPrompt.receive(createContext({ stop_reason: 'end_turn', content: [] }, sent));

        assert.strictEqual(sent[0].payload.answer, '');
    });

    it('throws when required fields are missing', async () => {
        const CancelError = class CancelError extends Error {};

        // missing prompt
        try {
            await SendPrompt.receive({
                messages: { in: { content: { } } },
                auth: { apiKey: 'k' },
                httpRequest: async () => { throw new Error('should not be called'); },
                sendJson: async () => {},
                CancelError
            });
            assert.fail('expected to throw for missing prompt');
        } catch (err) {
            assert.strictEqual(err.message, 'Prompt is required');
        }

        // missing model
        try {
            await SendPrompt.receive({
                messages: { in: { content: { prompt: 'p' } } },
                auth: { apiKey: 'k' },
                httpRequest: async () => { throw new Error('should not be called'); },
                sendJson: async () => {},
                CancelError
            });
            assert.fail('expected to throw for missing model');
        } catch (err) {
            assert.strictEqual(err.message, 'Model is required');
        }

        // missing max_tokens
        try {
            await SendPrompt.receive({
                messages: { in: { content: { prompt: 'p', model: 'm' } } },
                auth: { apiKey: 'k' },
                httpRequest: async () => { throw new Error('should not be called'); },
                sendJson: async () => {},
                CancelError
            });
            assert.fail('expected to throw for missing max_tokens');
        } catch (err) {
            assert.strictEqual(err.message, 'Max Tokens is required');
        }
    });
});
