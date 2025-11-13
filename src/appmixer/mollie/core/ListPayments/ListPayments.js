'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'amount': {
        'type': 'object',
        'properties': {
            'value': { 'type': 'string', 'title': 'Amount.Value' },
            'currency': { 'type': 'string', 'title': 'Amount.Currency' }
        },
        'title': 'Amount'
    },
    'description': { 'type': 'string', 'title': 'Description' },
    'status': { 'type': 'string', 'title': 'Status' },
    '_links': {
        'type': 'object',
        'properties': {
            'self': {
                'type': 'object',
                'properties': {
                    'href': { 'type': 'string', 'title': 'Links.Self.Href' },
                    'type': { 'type': 'string', 'title': 'Links.Self.Type' }
                },
                'title': 'Links.Self'
            }
        },
        'title': 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { profileId, testmode, status, method, sequenceType, customerId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'payments', value: 'payments' });
        }

        // https://docs.mollie.com/reference/v2/payments-api/list-payments
        const params = {};

        if (profileId) {
            params.profileId = profileId;
        }

        if (testmode !== undefined) {
            params.testmode = testmode;
        }

        if (status) {
            params.status = status;
        }

        if (method) {
            params.method = method;
        }

        if (sequenceType) {
            params.sequenceType = sequenceType;
        }

        if (customerId) {
            params.customerId = customerId;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.mollie.com/v2/payments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            params
        });

        const records = data._embedded?.payments || data.payments || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
