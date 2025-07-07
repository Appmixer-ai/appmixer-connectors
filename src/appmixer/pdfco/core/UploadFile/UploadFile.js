
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { file, name } = context.messages.in.content;

        // https://apidocs.pdf.co/?#file-upload
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.pdf.co/v1/file/upload',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
