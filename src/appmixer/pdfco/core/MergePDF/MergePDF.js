
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { files, name } = context.messages.in.content;

        // https://apidocs.pdf.co/?#pdf-merge
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/pdf/merge',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
