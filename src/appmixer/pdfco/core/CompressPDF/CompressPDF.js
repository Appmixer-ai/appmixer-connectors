'use strict';

module.exports = {
    async receive(context) {

        const { file, compressionLevel } = context.messages.in.content;

        // Prepare request body
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
