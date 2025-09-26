'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { file, types, async } = context.messages.in.content;

        if (!file) {
            throw new context.CancelError('File is required');
        }

        // Prepare request body
        const requestBody = { url: file };

        // Normalize types to array format for multiselect field
        if (types) {
            const normalizedTypes = lib.normalizeMultiselectInput(types, context, 'Object Types to Decode');
            if (normalizedTypes.length > 0) {
                requestBody.types = normalizedTypes.join(',');
            }
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
