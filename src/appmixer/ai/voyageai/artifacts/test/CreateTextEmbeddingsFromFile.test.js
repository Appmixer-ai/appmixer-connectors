const assert = require('assert');
const { Readable } = require('stream');
const sinon = require('sinon');
const testUtils = require('../../../../../../test/utils.js');

describe('ai/voyageai CreateTextEmbeddingsFromFile component', () => {
    let component;

    beforeEach(() => {
        delete require.cache[require.resolve('../../CreateTextEmbeddingsFromFile/CreateTextEmbeddingsFromFile')];
        component = require('../../CreateTextEmbeddingsFromFile/CreateTextEmbeddingsFromFile');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('splits file, calls VoyageAPI and sends embeddings per part', async () => {
        // Build a small readable stream for the file content
        const fileContent = Buffer.from('This is a small test file content');
        const readStream = Readable.from([fileContent]);

        // stub splitText to return chunks for the part
        sinon.stub(component, 'splitText').resolves(['chunk1']);

        const sent = [];
        const context = testUtils.createMockContext({
            messages: { in: { content: { fileId: 'file-1', model: 'voyage-2' } } },
            auth: { apiKey: 'test-api-key' },
            getFileReadStream: async (fileId) => readStream,
            getFileInfo: async (fileId) => ({ fileId, size: fileContent.length }),
            httpRequest: {
                post: async (url, body, opts) => ({ data: { data: [{ embedding: [0.5, 0.6] }] } })
            },
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
        }, /File ID is required|fileId is required/);
    });
});
