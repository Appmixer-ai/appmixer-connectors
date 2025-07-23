
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { query } = context.messages.in.content;

        // https://resend.com/docs/api-reference#get-emails
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.resend.com/v1/emails',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
