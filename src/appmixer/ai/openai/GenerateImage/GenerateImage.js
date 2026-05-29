'use strict';

const { Readable } = require('stream');
const lib = require('../lib');

module.exports = {

    receive: async function(context) {

        const { prompt, size, model } = context.messages.in.content;
        if (!prompt) {
            throw new context.CancelError('Prompt is required');
        }

        const { data } = await lib.request(context, 'post', '/images/generations', {
            model: model || 'dall-e-3',
            prompt,
            size,
            n: 1
        });

        const item = data?.data?.[0];
        const filename = `generated-image-${(new Date).toISOString()}.png`;

        if (item?.url) {
            const response = await context.httpRequest.get(item.url, { responseType: 'stream' });
            const file = await context.saveFileStream(filename, response.data);
            return context.sendJson({ fileId: file.fileId, prompt, size }, 'out');
        }

        if (item?.b64_json) {
            const buffer = Buffer.from(item.b64_json, 'base64');
            const file = await context.saveFileStream(filename, Readable.from(buffer));
            return context.sendJson({ fileId: file.fileId, prompt, size }, 'out');
        }

        throw new context.CancelError('OpenAI returned no image data (neither url nor b64_json).');
    }
};
