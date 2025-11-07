
'use strict';

const lib = require('../../lib');
const schema = { 'resource':{ 'type':'string','title':'Resource' },'id':{ 'type':'string','title':'Id' },'amount':{ 'type':'object','properties':{ 'value':{ 'type':'string','title':'Amount.Value' },'currency':{ 'type':'string','title':'Amount.Currency' } },'title':'Amount' },'paymentId':{ 'type':'string','title':'Payment Id' } };

module.exports = {
    async receive(context) {

        const { profileId, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: '_embedded.chargebacks' });
        }

        // https://docs.mollie.com/reference/v2/chargebacks-api/list-chargebacks
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/chargebacks',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
