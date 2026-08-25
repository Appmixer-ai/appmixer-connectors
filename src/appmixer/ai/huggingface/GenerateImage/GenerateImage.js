'use strict';

const pathModule = require('path');
const lib = require('../lib');

const MIME_EXTENSIONS = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

module.exports = {

    async receive(context) {

        const {
            model,
            prompt,
            negativePrompt,
            width,
            height,
            numInferenceSteps,
            guidanceScale,
            fileName
        } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!prompt) {
            throw new context.CancelError('Prompt is required!');
        }

        const parameters = {};
        if (negativePrompt) {
            parameters.negative_prompt = negativePrompt;
        }
        if (width) {
            parameters.width = width;
        }
        if (height) {
            parameters.height = height;
        }
        if (numInferenceSteps) {
            parameters.num_inference_steps = numInferenceSteps;
        }
        if (guidanceScale !== undefined && guidanceScale !== null && guidanceScale !== '') {
            parameters.guidance_scale = Number(guidanceScale);
        }

        const data = { inputs: prompt };
        if (Object.keys(parameters).length > 0) {
            data.parameters = parameters;
        }

        // Text-to-image is not part of the OpenAI compatible /v1 surface, so this
        // goes through the hf-inference task route. That provider answers with the
        // raw image bytes; other providers answer with JSON carrying base64 or a
        // URL, so all three shapes are handled below.
        const response = await context.httpRequest({
            method: 'POST',
            url: `${lib.ROUTER_BASE_URL}/hf-inference/models/${lib.encodeRepoId(model)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data,
            responseType: 'arraybuffer'
        });

        const contentType = String(
            (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || ''
        ).split(';')[0].trim().toLowerCase();

        let buffer;
        let mimeType = contentType;

        if (MIME_EXTENSIONS[contentType]) {
            buffer = Buffer.from(response.data);
        } else {
            // Not an image content type — the provider answered with JSON.
            const payload = parseJsonBuffer(response.data);
            const base64 = payload
                && Array.isArray(payload.data)
                && payload.data[0]
                && payload.data[0].b64_json;

            if (base64) {
                buffer = Buffer.from(base64, 'base64');
                mimeType = 'image/png';
            } else if (payload && Array.isArray(payload.output) && payload.output[0]) {
                const imageResponse = await context.httpRequest({
                    method: 'GET',
                    url: payload.output[0],
                    responseType: 'arraybuffer'
                });
                buffer = Buffer.from(imageResponse.data);
                mimeType = String(
                    (imageResponse.headers && imageResponse.headers['content-type']) || 'image/png'
                ).split(';')[0].trim().toLowerCase();
            } else {
                throw new context.CancelError(
                    `Model ${model} did not return an image. Pick a text-to-image model.`
                );
            }
        }

        const extension = MIME_EXTENSIONS[mimeType] || 'png';
        const name = fileName
            ? String(fileName)
            : `huggingface-image-${Date.now()}.${extension}`;

        const savedFile = await context.saveFileStream(pathModule.normalize(name), buffer);

        return context.sendJson({
            fileId: savedFile.fileId,
            fileName: name,
            contentType: mimeType || `image/${extension}`,
            size: buffer.length,
            model
        }, 'out');
    }
};

/**
 * Decode a response body that was requested as an arraybuffer but turned out to
 * be JSON.
 * @param {Buffer|ArrayBuffer|string} raw
 * @returns {object|null}
 */
function parseJsonBuffer(raw) {

    try {
        return JSON.parse(Buffer.from(raw).toString('utf8'));
    } catch (error) {
        return null;
    }
}
