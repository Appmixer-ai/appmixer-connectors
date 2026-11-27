'use strict';

const assert = require('assert');

const TranslateText = require('../../TranslateText/TranslateText');
const ClassifyImage = require('../../ClassifyImage/ClassifyImage');
const DetectObjects = require('../../DetectObjects/DetectObjects');
const FindDatasets = require('../../FindDatasets/FindDatasets');

class CancelError extends Error {}

// A minimal component context: records every HTTP request and every sent message,
// answers each request with `responseData`.
function createContext(content, { responseData, fileInfo, fileContent, properties } = {}) {

    const context = {
        auth: { apiKey: 'hf_test' },
        config: {},
        properties: properties || {},
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        async httpRequest(options) {
            context.requests.push(options);
            return { data: responseData };
        },
        async getFileInfo() {
            return fileInfo || { contentType: 'image/jpeg' };
        },
        async loadFile() {
            return fileContent || Buffer.from('fake-image-bytes');
        },
        async sendJson(data, port) {
            context.sent.push({ data, port });
        }
    };
    return context;
}

describe('huggingface TranslateText', () => {

    it('unwraps the [{ translation_text }] pipeline shape and omits language codes when not set', async () => {

        const context = createContext(
            { model: 'Helsinki-NLP/opus-mt-en-fr', text: 'Good morning' },
            { responseData: [{ translation_text: 'Bonjour' }] }
        );
        await TranslateText.receive(context);

        assert.strictEqual(context.requests[0].url,
            'https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-fr');
        assert.deepStrictEqual(context.requests[0].data, { inputs: 'Good morning' });
        assert.strictEqual(context.sent[0].data.translation, 'Bonjour');
    });

    it('accepts the documented single-object shape and sends src_lang / tgt_lang', async () => {

        const context = createContext(
            { model: 'google-t5/t5-small', text: 'The house', sourceLanguage: 'en', targetLanguage: 'de' },
            { responseData: { translation_text: 'Das Haus' } }
        );
        await TranslateText.receive(context);

        assert.deepStrictEqual(context.requests[0].data.parameters, { src_lang: 'en', tgt_lang: 'de' });
        assert.strictEqual(context.sent[0].data.translation, 'Das Haus');
        assert.strictEqual(context.sent[0].data.targetLanguage, 'de');
    });
});

describe('huggingface ClassifyImage', () => {

    it('sends the image base64 encoded and returns labels sorted by score', async () => {

        const context = createContext(
            { model: 'google/vit-base-patch16-224', fileId: 'f1', topK: 2 },
            { responseData: [{ label: 'tiger cat', score: 0.1 }, { label: 'tabby', score: 0.8 }] }
        );
        await ClassifyImage.receive(context);

        assert.strictEqual(context.requests[0].data.inputs, Buffer.from('fake-image-bytes').toString('base64'));
        assert.deepStrictEqual(context.requests[0].data.parameters, { top_k: 2 });
        assert.strictEqual(context.sent[0].data.label, 'tabby');
        assert.strictEqual(context.sent[0].data.labels.length, 2);
    });

    it('refuses a file that is not an image', async () => {

        const context = createContext(
            { model: 'google/vit-base-patch16-224', fileId: 'f1' },
            { fileInfo: { contentType: 'application/pdf' } }
        );
        await assert.rejects(() => ClassifyImage.receive(context), CancelError);
        assert.strictEqual(context.requests.length, 0);
    });
});

describe('huggingface DetectObjects', () => {

    it('maps detections with their bounding boxes and passes the threshold', async () => {

        const context = createContext(
            { model: 'facebook/detr-resnet-50', fileId: 'f1', threshold: 0.9 },
            {
                responseData: [
                    { label: 'remote', score: 0.95, box: { xmin: 1, ymin: 2, xmax: 3, ymax: 4 } },
                    { label: 'cat', score: 0.99, box: { xmin: 5, ymin: 6, xmax: 7, ymax: 8 } }
                ]
            }
        );
        await DetectObjects.receive(context);

        assert.deepStrictEqual(context.requests[0].data.parameters, { threshold: 0.9 });
        const out = context.sent[0].data;
        assert.strictEqual(out.count, 2);
        assert.strictEqual(out.objects[0].label, 'cat');
        assert.deepStrictEqual(out.objects[0].box, { xmin: 5, ymin: 6, xmax: 7, ymax: 8 });
        assert.deepStrictEqual(out.labels, ['cat', 'remote']);
    });

    it('returns an empty result when nothing passes the threshold', async () => {

        const context = createContext({ model: 'facebook/detr-resnet-50', fileId: 'f1' }, { responseData: [] });
        await DetectObjects.receive(context);

        assert.strictEqual(context.sent[0].data.count, 0);
        assert.deepStrictEqual(context.sent[0].data.objects, []);
    });
});

describe('huggingface FindDatasets', () => {

    it('repeats the filter parameter and maps dataset records', async () => {

        const context = createContext(
            {
                search: 'squad',
                author: 'rajpurkar',
                filter: 'language:en, task_categories:question-answering',
                sort: 'downloads',
                outputType: 'array'
            },
            { responseData: [{ id: 'rajpurkar/squad', author: 'rajpurkar', downloads: 10, gated: false, tags: ['language:en'] }] }
        );
        await FindDatasets.receive(context);

        const url = new URL(context.requests[0].url);
        assert.strictEqual(url.pathname, '/api/datasets');
        assert.deepStrictEqual(url.searchParams.getAll('filter'), ['language:en', 'task_categories:question-answering']);
        assert.strictEqual(url.searchParams.get('direction'), '-1');

        const { result, count } = context.sent[0].data;
        assert.strictEqual(count, 1);
        assert.strictEqual(result[0].url, 'https://huggingface.co/datasets/rajpurkar/squad');
        assert.strictEqual(result[0].gated, 'none');
        assert.deepStrictEqual(Object.keys(result[0]).sort(), Object.keys(FindDatasets.ITEM_SCHEMA.properties).sort());
    });

    it('sends to notFound when the Hub returns no dataset', async () => {

        const context = createContext({ search: 'no-such-dataset-xyz', outputType: 'array' }, { responseData: [] });
        await FindDatasets.receive(context);

        assert.strictEqual(context.sent[0].port, 'notFound');
    });
});
