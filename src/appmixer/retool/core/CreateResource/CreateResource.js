
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { name, type, configuration } = context.messages.in.content;

        // https://docs.retool.com/org-users/guides/retool-api/authentication
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/resources',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
