'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { model, fileId, threshold } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!fileId) {
            throw new context.CancelError('File ID is required!');
        }

        const data = { inputs: await lib.loadImageBase64(context, fileId) };

        if (threshold !== undefined && threshold !== null && threshold !== '') {
            data.parameters = { threshold: Number(threshold) };
        }

        const response = await lib.makeRequest({
            context,
            method: 'POST',
            baseUrl: lib.ROUTER_BASE_URL,
            path: `/hf-inference/models/${lib.encodeRepoId(model)}`,
            data
        });

        if (!Array.isArray(response)) {
            throw new context.CancelError(
                `Model ${model} did not return detections. Pick an object-detection model.`
            );
        }

        // Each detection is { label, score, box: { xmin, ymin, xmax, ymax } } in pixels.
        // An image with nothing above the threshold is a valid, empty result.
        const objects = response
            .filter(item => item && item.label !== undefined)
            .map(({ label, score, box }) => ({
                label,
                score,
                box: {
                    xmin: box ? box.xmin : null,
                    ymin: box ? box.ymin : null,
                    xmax: box ? box.xmax : null,
                    ymax: box ? box.ymax : null
                }
            }))
            .sort((a, b) => (b.score || 0) - (a.score || 0));

        return context.sendJson({
            model,
            count: objects.length,
            labels: [...new Set(objects.map(object => object.label))],
            objects
        }, 'out');
    }
};
