
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { invoice_id, message_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/invoices-api/invoices/messages/
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: '/invoices/{invoice_id}/messages/{message_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
