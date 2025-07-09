'use strict';

module.exports = {
    async receive(context) {

        const { file, types, async } = context.messages.in.content;

        // Prepare request body
        const requestBody = { url: file };
        if (types && Array.isArray(types) && types.length > 0) {
            requestBody.types = types.join(',');
        }
        if (async === true) {
            requestBody.async = true;
        }

        // https://apidocs.pdf.co/?#barcode-reader (correct endpoint: /v1/barcode/read/from/url)
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/barcode/read/from/url',
            headers: {
                'x-api-key': context.auth.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });
        return context.sendJson(data, 'out');
    }
};
