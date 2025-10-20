
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { first_name, last_name, email, timezone, is_admin, is_project_manager, telephone } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/users-api/users/users/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/users',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
