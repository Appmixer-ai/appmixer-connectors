'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { model, text, sourceLanguage, targetLanguage } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!text) {
            throw new context.CancelError('Text is required!');
        }

        const data = { inputs: text };
        const parameters = {};

        // Only multi-language models (e.g. google-t5/t5-base) need src_lang / tgt_lang;
        // language-pair models such as Helsinki-NLP/opus-mt-en-fr do not, so the keys
        // are sent only when the user set them.
        if (sourceLanguage) {
            parameters.src_lang = String(sourceLanguage).trim();
        }
        if (targetLanguage) {
            parameters.tgt_lang = String(targetLanguage).trim();
        }
        if (Object.keys(parameters).length > 0) {
            data.parameters = parameters;
        }

        const response = await lib.makeRequest({
            context,
            method: 'POST',
            baseUrl: lib.ROUTER_BASE_URL,
            path: `/hf-inference/models/${lib.encodeRepoId(model)}`,
            data
        });

        // The task specification documents a single { translation_text } object, while
        // the transformers pipeline behind hf-inference answers with one result per
        // input: [{ translation_text }]. Accept both shapes.
        const result = Array.isArray(response) ? response[0] : response;
        const translation = result && result.translation_text;

        if (typeof translation !== 'string') {
            throw new context.CancelError(
                `Model ${model} did not return a translation. Pick a translation model.`
            );
        }

        return context.sendJson({
            model,
            translation,
            sourceLanguage: sourceLanguage || null,
            targetLanguage: targetLanguage || null
        }, 'out');
    }
};
