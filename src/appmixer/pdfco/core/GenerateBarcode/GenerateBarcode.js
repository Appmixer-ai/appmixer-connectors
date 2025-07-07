
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { type, text, format } = context.messages.in.content;

        // https://apidocs.pdf.co/?#barcode-generate
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/barcode/generate',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
