
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file } = context.messages.in.content;

        // https://apidocs.pdf.co/?#pdf-info
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/info',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
