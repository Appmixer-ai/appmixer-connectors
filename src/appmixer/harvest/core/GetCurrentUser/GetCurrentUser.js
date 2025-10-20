
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const {  } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/users-api/users/users/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/users/me',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
