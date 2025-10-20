
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { role_id, name, user_ids } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/roles-api/roles/roles/
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/roles/{role_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
