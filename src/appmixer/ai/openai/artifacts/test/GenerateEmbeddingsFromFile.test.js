const assert = require('assert');
const sinon = require('sinon');
const Module = require('module');
/* eslint-disable no-underscore-dangle */
const { Readable } = require('stream');
const testUtils = require('../../../../../../test/utils.js');

describe('ai/openai GenerateEmbeddingsFromFile component', () => {
    let component;
    let originalModuleLoad;

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
                                return { data: input.map((_, idx) => ({ embedding: [idx + 0.5, idx + 0.6] })) };
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
        delete require.cache[require.resolve('../../GenerateEmbeddingsFromFile/GenerateEmbeddingsFromFile')];

        // Clear cached modules and load fresh
        delete require.cache[require.resolve('../../GenerateEmbeddingsFromFile/GenerateEmbeddingsFromFile')];
        component = require('../../GenerateEmbeddingsFromFile/GenerateEmbeddingsFromFile');
    });

    afterEach(() => {
        // Restore module loader and sinon state
        Module._load = originalModuleLoad;
        sinon.restore();
    });

    it('splits file, calls OpenAI SDK and sends embeddings per part', async () => {
        // Build a small readable stream for the file content
        const fileContent = Buffer.from('This is a small test file content');
        const readStream = Readable.from([fileContent]);

        const sent = [];
        const context = testUtils.createMockContext({
            messages: { in: { content: { fileId: 'file-1', model: 'text-embedding-ada-002' } } },
            auth: { apiKey: 'test-api-key' },
            getFileReadStream: async (fileId) => readStream,
            getFileInfo: async (fileId) => ({ fileId, size: fileContent.length }),
            sendJson: (payload, port) => {
                sent.push({ payload, port });
                return Promise.resolve();
            }
        });

        await component.receive(context);

        // For a single part we expect one sendJson call
        assert.strictEqual(sent.length, 1);
        const result = sent[0].payload || sent[0].data || sent[0];
        assert.ok(Array.isArray(result.embeddings));
        assert.strictEqual(result.embeddings.length, 1);
        assert.deepStrictEqual(result.embeddings[0].vector, [0.5, 0.6]);
        assert.strictEqual(sent[0].port, 'out');
    });

    it('throws CancelError when fileId is missing', async () => {
        const context = testUtils.createMockContext({ messages: { in: { content: {} } } });

        await assert.rejects(async () => {
            await component.receive(context);
        }, /fileId is required|File ID is required/);
    });
});
