
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { userId, email } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#emails
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/emails',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
