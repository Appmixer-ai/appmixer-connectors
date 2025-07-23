
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // https://docs.lemonsqueezy.com/api/orders#get-order
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/orders/{id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
