
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { id, email, firstName, lastName } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#users
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/users/{id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
