'use strict';

module.exports = {
    async receive(context) {

        const { type, text, format, async } = context.messages.in.content;

        // Prepare request body
        const requestBody = { type, value: text };
        if (format) {
            requestBody.format = format;
        }
        if (async === true) {
            requestBody.async = true;
        }

        // https://apidocs.pdf.co/?#barcode-generate
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/barcode/generate',
            headers: {
                'x-api-key': context.auth.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
