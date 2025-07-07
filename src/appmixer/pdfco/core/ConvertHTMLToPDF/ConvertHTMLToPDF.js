
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { html, url, paperSize, orientation } = context.messages.in.content;

        // https://apidocs.pdf.co/?#html-to-pdf
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/convert/from/html',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
