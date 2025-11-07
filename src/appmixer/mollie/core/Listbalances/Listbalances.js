
'use strict';

const lib = require('../../lib');
const schema = { 'resource':{ 'type':'string','title':'Resource' },'id':{ 'type':'string','title':'Id' },'type':{ 'type':'string','title':'Type' },'currency':{ 'type':'string','title':'Currency' } };

module.exports = {
    async receive(context) {

        const { testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: '_embedded.balances' });
        }

        // https://docs.mollie.com/reference/v2/balances-api/list-balances
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/balances',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params: testmode ? { testmode: true } : {}
        });

        const records = data._embedded?.balances || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
