
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // https://resend.com/docs/api-reference#get-email
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/emails/{id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
