'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { model, fileId, topK } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        // The task takes the image as a base64 string in `inputs`; that JSON form also
        // carries `parameters`, so one request shape covers every input combination.
        const data = { inputs: await lib.loadImageBase64(context, fileId) };

        if (topK) {
            data.parameters = { top_k: Number(topK) };
        }

        const response = await lib.makeRequest({
            context,
            method: 'POST',
            baseUrl: lib.ROUTER_BASE_URL,
            path: `/hf-inference/models/${lib.encodeRepoId(model)}`,
            data
        });

        // Image classification answers with a flat array of { label, score }.
        const labels = Array.isArray(response) ? response.filter(item => item && item.label !== undefined) : [];

        if (labels.length === 0) {
            throw new context.CancelError(
                `Model ${model} did not return any labels. Pick an image-classification model.`
            );
        }

        const sorted = [...labels]
            .map(({ label, score }) => ({ label, score }))
            .sort((a, b) => (b.score || 0) - (a.score || 0));

        return context.sendJson({
            model,
            label: sorted[0].label,
            score: sorted[0].score,
            labels: sorted
        }, 'out');
    }
};
