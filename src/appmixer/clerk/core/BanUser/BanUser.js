
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { id, reason } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#users
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/users/{id}/ban',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
