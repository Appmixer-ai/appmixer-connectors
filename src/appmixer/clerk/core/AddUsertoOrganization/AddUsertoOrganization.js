
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { id, userId } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#organizations
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/organizations/{id}/users',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
