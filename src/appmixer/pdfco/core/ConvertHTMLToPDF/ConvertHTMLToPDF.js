'use strict';

module.exports = {
    async receive(context) {

        const { html, url, paperSize, orientation, async } = context.messages.in.content;

        let endpoint;
        let requestBody;

        if (url) {
            // URL to PDF conversion
            endpoint = 'https://api.pdf.co/v1/pdf/convert/from/url';
            requestBody = { url };
        } else {
            // HTML to PDF conversion
            endpoint = 'https://api.pdf.co/v1/pdf/convert/from/html';
            requestBody = { html };
        }

        // Add common optional parameters
        if (paperSize) {
            requestBody.paperSize = paperSize;
        }
        if (orientation) {
            requestBody.orientation = orientation;
        }
        if (async === true) {
            requestBody.async = true;
        }

        // https://apidocs.pdf.co/?#html-to-pdf or #url-to-pdf
        const { data } = await context.httpRequest({
            method: 'POST',
            url: endpoint,
            headers: {
                'x-api-key': context.auth.apiKey,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
