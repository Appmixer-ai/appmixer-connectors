'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'status': { 'type': 'string', 'title': 'Status' },
    'amount': {
        'type': 'object',
        'properties': {
            'value': { 'type': 'string', 'title': 'Amount.Value' },
            'currency': { 'type': 'string', 'title': 'Amount.Currency' }
        },
        'title': 'Amount'
    }
};

module.exports = {
    async receive(context) {

        const { testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Settlements', value: 'settlements' });
        }

        // https://docs.mollie.com/reference/v2/settlements-api/list-settlements
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/settlements',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params: testmode ? { testmode: true } : {}
        });

        const settlements = data._embedded?.settlements || [];

        return lib.sendArrayOutput({
            context,
            outputPortName: 'out',
            outputType,
            records: settlements
        });
    }
};
