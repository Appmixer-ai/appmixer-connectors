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

        const { profileId, status, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'orders', value: 'orders' });
        }

        // https://docs.mollie.com/reference/v2/orders-api/list-orders
        const params = {};

        if (profileId) {
            params.profileId = profileId;
        }

        if (status) {
            params.status = status;
        }

        if (testmode) {
            params.testmode = testmode;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/orders',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        const records = data._embedded?.orders || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
