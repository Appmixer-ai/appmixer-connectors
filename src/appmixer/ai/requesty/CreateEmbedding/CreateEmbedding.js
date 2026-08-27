'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { model, input, encodingFormat } = context.messages.in.content;

        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!input) {
            throw new context.CancelError('Input is required!');
        }

        const data = {
            model,
            input
        };
        if (encodingFormat) {
            data.encoding_format = encodingFormat;
        }

        const { data: response } = await context.httpRequest({
            method: 'POST',
            url: `${lib.getBaseUrl()}/embeddings`,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Bearer ${context.auth.apiKey}`
            },
            data
        });

        // Expose the first embedding vector directly for convenient downstream wiring.
        const outputData = {
            model: response.model,
            embedding: response.data?.[0]?.embedding,
            data: response.data,
            usage: response.usage
        };

        return context.sendJson(outputData, 'out');
    }
};
