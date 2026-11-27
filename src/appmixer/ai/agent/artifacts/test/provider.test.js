'use strict';

const assert = require('assert');
const sinon = require('sinon');

const auth = require('../../auth');
const provider = require('../../provider');

describe('ai.agent provider context window', () => {

    // The context of auth.js functions: the dialog fields are on the context itself.
    function authContext(fields, data) {

        return { ...fields, httpRequest: { get: sinon.stub().resolves({ data }) } };
    }

    describe('listModels', () => {

        it('reports the context window of Anthropic models', async () => {

            const context = authContext({ provider: 'anthropic', apiKey: 'key' }, {
                data: [
                    { id: 'claude-sonnet-4-6', max_input_tokens: 1000000 },
                    { id: 'claude-sonnet-4-5', max_input_tokens: 200000 }
                ]
            });

            assert.deepStrictEqual(await provider.listModels(context), [
                { id: 'claude-sonnet-4-6', contextWindow: 1000000 },
                { id: 'claude-sonnet-4-5', contextWindow: 200000 }
            ]);
            assert.strictEqual(
                context.httpRequest.get.firstCall.args[0],
                'https://api.anthropic.com/v1/models?limit=1000'
            );
        });

        it('reads the fields other providers use', async () => {

            const google = authContext({ provider: 'google', apiKey: 'key' }, {
                models: [{
                    name: 'models/gemini-2.0-flash',
                    inputTokenLimit: 1048576,
                    supportedGenerationMethods: ['generateContent']
                }]
            });
            assert.deepStrictEqual(await provider.listModels(google), [
                { id: 'gemini-2.0-flash', contextWindow: 1048576 }
            ]);

            const groq = authContext({ provider: 'groq', apiKey: 'key' }, {
                data: [{ id: 'llama-3.3-70b', context_window: 131072 }]
            });
            assert.strictEqual((await provider.listModels(groq))[0].contextWindow, 131072);

            const openRouter = authContext(
                { provider: 'openai-compatible', apiKey: 'key', baseURL: 'https://openrouter.ai/api/v1/' },
                { data: [{ id: 'vendor/model', context_length: 64000 }] }
            );
            assert.strictEqual((await provider.listModels(openRouter))[0].contextWindow, 64000);
        });

        it('leaves the context window undefined where the provider does not report it', async () => {

            const context = authContext({ provider: 'openai', apiKey: 'key' }, { data: [{ id: 'gpt-4o' }] });

            assert.deepStrictEqual(await provider.listModels(context), [{ id: 'gpt-4o', contextWindow: undefined }]);
        });
    });

    describe('requestProfileInfo', () => {

        const { requestProfileInfo } = auth.definition();

        it('records the context windows when the account is connected', async () => {

            const context = authContext({ provider: 'anthropic', apiKey: 'key' }, {
                data: [
                    { id: 'claude-sonnet-4-6', max_input_tokens: 1000000 },
                    { id: 'no-window' }
                ]
            });

            assert.deepStrictEqual(await requestProfileInfo(context), {
                contextWindows: [{ id: 'claude-sonnet-4-6', contextWindow: 1000000 }]
            });
        });

        it('does not fail the connection when the models cannot be listed', async () => {

            const context = authContext({ provider: 'anthropic', apiKey: 'key' });
            context.httpRequest.get.rejects(new Error('503'));

            assert.deepStrictEqual(await requestProfileInfo(context), { contextWindows: [] });
        });
    });

    describe('getContextWindow', () => {

        const profileInfo = { contextWindows: [{ id: 'claude-sonnet-4-6', contextWindow: 1000000 }] };

        it('reads the window of the selected model from the profile info, without a request', () => {

            const context = { profileInfo, properties: { model: 'claude-sonnet-4-6' } };

            assert.strictEqual(provider.getContextWindow(context), 1000000);
        });

        it('returns undefined for a model that is not recorded', () => {

            assert.strictEqual(
                provider.getContextWindow({ profileInfo, properties: { model: 'released-later' } }),
                undefined
            );
        });

        it('returns undefined for an account connected before context windows were recorded', () => {

            assert.strictEqual(provider.getContextWindow({ properties: { model: 'claude-sonnet-4-6' } }), undefined);
            assert.strictEqual(
                provider.getContextWindow({ profileInfo: {}, properties: { model: 'claude-sonnet-4-6' } }),
                undefined
            );
        });
    });
});
