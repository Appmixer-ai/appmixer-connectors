
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { domain } = context.messages.in.content;

        // https://resend.com/docs/api-reference#create-domain
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/domains',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
