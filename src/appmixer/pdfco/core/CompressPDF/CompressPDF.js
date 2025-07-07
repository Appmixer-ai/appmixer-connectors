
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file, compressionLevel } = context.messages.in.content;

        if (!file) {
            throw new Error('File parameter is required');
        }

        const requestBody = { url: file };
        if (compressionLevel !== undefined) {
            requestBody.compressionLevel = compressionLevel;
        }

        // https://apidocs.pdf.co/?#pdf-optimize
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/optimize',
            headers: {
                'x-api-key': context.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
