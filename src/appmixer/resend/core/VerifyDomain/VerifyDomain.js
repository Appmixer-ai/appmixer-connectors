
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // https://resend.com/docs/api-reference#verify-domain
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/domains/{id}/verify',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
