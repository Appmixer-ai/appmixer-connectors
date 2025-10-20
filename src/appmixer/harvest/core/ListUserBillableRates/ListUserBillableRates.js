
'use strict';

const lib = require('../../lib.generated');
const schema = { 'amount':{ 'type':'number','title':'Amount' },'start_date':{ 'type':'string','title':'Start Date' } };

module.exports = {
    async receive(context) {

        const { user_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Billable_rates' });
        }

        // https://help.getharvest.com/api-v2/users-api/users/billable-rates/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/users/{user_id}/billable_rates',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
