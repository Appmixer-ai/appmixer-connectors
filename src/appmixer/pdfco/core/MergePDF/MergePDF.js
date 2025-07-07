
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { files, name } = context.messages.in.content;

        if (!files || !Array.isArray(files) || files.length === 0) {
            throw new Error('Files parameter is required and must be a non-empty array');
        }

        const requestBody = { url: files.join(',') };
        if (name) {
            requestBody.name = name;
        }

        // https://apidocs.pdf.co/?#pdf-merge
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/merge',
            headers: {
                'x-api-key': context.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
