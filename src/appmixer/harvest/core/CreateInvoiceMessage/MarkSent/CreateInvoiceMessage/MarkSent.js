
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { invoice_id, event_type, recipients, subject, body, attach_pdf, send_me_a_copy } = context.messages.in.content;


        // https://help.getharvest.com/api-v2/invoices-api/invoices/messages/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: '/invoices/{invoice_id}/messages',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });


        return context.sendJson(data, 'out');
    }
};
