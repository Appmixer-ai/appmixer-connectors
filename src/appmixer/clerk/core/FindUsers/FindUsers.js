
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { query } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#users
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/users',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
