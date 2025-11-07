'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'description': { 'type': 'string', 'title': 'Description' },
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

        const { profileId, archived, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'payment_links', value: 'payment_links' });
        }

        // https://docs.mollie.com/reference/v2/payment-links-api/list-payment-links
        const params = {};

        if (profileId) {
            params.profileId = profileId;
        }

        if (typeof archived === 'boolean') {
            params.archived = archived;
        }

        if (typeof testmode === 'boolean') {
            params.testmode = testmode;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/payment-links',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        const records = data._embedded?.payment_links || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
