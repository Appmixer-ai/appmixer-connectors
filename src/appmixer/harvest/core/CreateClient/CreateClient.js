
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { name, is_active, address, currency } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/clients-api/clients/clients/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/clients',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
