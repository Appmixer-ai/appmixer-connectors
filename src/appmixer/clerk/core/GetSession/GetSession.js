
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#sessions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/sessions/{id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
