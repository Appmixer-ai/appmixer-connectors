
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file, compressionLevel } = context.messages.in.content;

        // https://apidocs.pdf.co/?#pdf-compress
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/compress',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
