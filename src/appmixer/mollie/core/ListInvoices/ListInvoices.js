'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'reference': { 'type': 'string', 'title': 'Reference' },
    'issuedAt': { 'type': 'string', 'title': 'Issued At' },
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

        const { year, reference, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Invoices' });
        }

        // https://docs.mollie.com/reference/v2/invoices-api/list-invoices
        const params = {};

        if (year) {
            params.year = year;
        }

        if (reference) {
            params.reference = reference;
        }

        if (testmode !== undefined && testmode !== null) {
            params.testmode = testmode;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/invoices',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        const records = data._embedded?.invoices || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
