const assert = require('assert');
const sinon = require('sinon');
const Module = require('module');
/* eslint-disable no-underscore-dangle */
const testUtils = require('../../../../../../test/utils.js');

describe('ai/openai GenerateEmbeddings component', () => {
    let originalModuleLoad;
    let component;

    beforeEach(() => {
        // Intercept require('openai') so that when lib.js does `const OpenAI = require('openai')`
        // it will receive our fake OpenAI implementation.
        originalModuleLoad = Module._load;

        Module._load = function(request, parent, isMain) {
            if (request === 'openai') {
                // Provide a fake OpenAI constructor which exposes `embeddings.create`
                class FakeOpenAI {
                    constructor(cfg) {
                        this._cfg = cfg;
                        this.embeddings = {
                            create: async ({ model, input }) => {
                                return {
                                    data: input.map((_, idx) => ({ embedding: [idx + 0.1, idx + 0.2] }))
                                };
                            }
                        };
                    }
                }
                return FakeOpenAI;
            }
            return originalModuleLoad.apply(this, arguments);
        };

        // Clear cached modules so they pick up our mocked 'openai' when loading.
        delete require.cache[require.resolve('../../lib')];
        delete require.cache[require.resolve('../../GenerateEmbeddings/GenerateEmbeddings')];

        // Now require the component (it will load the fake OpenAI via the lib)
        component = require('../../GenerateEmbeddings/GenerateEmbeddings');
    });

    afterEach(() => {
        // Restore module loader and sinon state
        Module._load = originalModuleLoad;
        sinon.restore();
    });

    it('calls OpenAI SDK and sends result to out port', async () => {
        // Stub the component.splitText to avoid using the actual langchain splitter
        sinon.stub(component, 'splitText').resolves(['hello world']);

        const sent = [];
        const context = testUtils.createMockContext({
            messages: { in: { content: { text: 'hello world' } } },
            auth: { apiKey: 'test-key' },
            config: {},
            sendJson: (data, port) => {
                sent.push({ data, port });
                return Promise.resolve();
            }
        });

        await component.receive(context);

        assert.strictEqual(sent.length, 1, 'sendJson should be called once');
        const payload = sent[0].data;
        assert.strictEqual(payload.embeddings.length, 1, 'should produce one embedding');
        assert.deepStrictEqual(payload.embeddings[0].text, 'hello world');
        assert.deepStrictEqual(payload.firstVector, payload.embeddings[0].vector);
        assert.strictEqual(sent[0].port, 'out', 'should send to out port');
    });

    it('throws CancelError when text is missing', async () => {
        const context = testUtils.createMockContext({ messages: { in: { content: {} } } });

        await assert.rejects(async () => {
            await component.receive(context);
        }, /Text is required|Cannot read property 'splitText'|text is not defined/);
    });
});
