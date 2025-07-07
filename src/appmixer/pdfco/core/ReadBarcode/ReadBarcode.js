
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file, types } = context.messages.in.content;

        if (!file) {
            throw new Error('File parameter is required');
        }

        const requestBody = { url: file };
        if (types) {
            requestBody.types = types;
        }

        // https://apidocs.pdf.co/?#barcode-read
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/barcode/read',
            headers: {
                'x-api-key': context.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
