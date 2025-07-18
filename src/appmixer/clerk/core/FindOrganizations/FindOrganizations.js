
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { query } = context.messages.in.content;

        // https://clerk.com/docs/references/backend/overview#organizations
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/organizations',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
