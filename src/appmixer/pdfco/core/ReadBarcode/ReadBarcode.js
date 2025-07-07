
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file, types } = context.messages.in.content;

        // https://apidocs.pdf.co/?#barcode-read
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/barcode/read',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
