const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../../test/utils.js');

describe('ai/voyageai GenerateEmbeddings component', () => {
    let component;

    beforeEach(() => {
        delete require.cache[require.resolve('../../GenerateEmbeddings/GenerateEmbeddings')];
        component = require('../../GenerateEmbeddings/GenerateEmbeddings');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('generates embeddings and sends out payload', async () => {
        // stub splitText to avoid using the real langchain splitter
        sinon.stub(component, 'splitText').resolves(['hello world']);

        const sent = [];
        const context = testUtils.createMockContext({
            messages: { in: { content: { text: 'hello world' } } },
            auth: { apiKey: 'test-api-key' },
            httpRequest: {
                post: async (url, body, opts) => {
                    // emulate voyageai response shape
                    return { data: { data: [{ embedding: [0.1, 0.2], index: 0 }] } };
                }
            },
            sendJson: (payload, port) => {
                sent.push({ payload, port });
                return Promise.resolve();
            }
        });

        await component.receive(context);

        assert.strictEqual(sent.length, 1, 'should send one message');

        // component sends via sendJson(payload, 'out') so our capture is in sent[0].payload
        const result = sent[0].payload || sent[0].data || sent[0];
        assert.ok(result.embeddings, 'payload should contain embeddings');
        assert.strictEqual(result.embeddings.length, 1);
        assert.deepStrictEqual(result.embeddings[0].text, 'hello world');
        assert.deepStrictEqual(result.firstVector, result.embeddings[0].vector);
        assert.strictEqual(sent[0].port, 'out');
    });
});
