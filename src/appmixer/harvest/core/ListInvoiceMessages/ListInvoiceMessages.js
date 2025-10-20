
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'event_type':{ 'type':'string','title':'Event Type' },'recipients':{ 'type':'array','items':{ 'type':'object','properties':{ 'name':{ 'type':'string','title':'Recipients.Name' },'email':{ 'type':'string','title':'Recipients.Email' } } },'title':'Recipients' },'sent_by':{ 'type':'string','title':'Sent By' },'sent_at':{ 'type':'string','title':'Sent At' } };

module.exports = {
    async receive(context) {

        const { invoice_id, page, per_page, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Messages' });
        }

        // https://help.getharvest.com/api-v2/invoices-api/invoices/messages/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/invoices/{invoice_id}/messages',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
