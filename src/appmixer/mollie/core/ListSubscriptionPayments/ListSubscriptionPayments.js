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
    'status': { 'type': 'string', 'title': 'Status' }
};

module.exports = {
    async receive(context) {

        const { customerId, subscriptionId, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Payments', value: 'payments' });
        }

        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        if (!subscriptionId) {
            throw new context.CancelError('Subscription Id is required!');
        }

        // https://docs.mollie.com/reference/v2/subscriptions-api/list-subscription-payments
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}/payments`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params: {
                testmode: testmode ? 'true' : undefined
            }
        });

        const payments = data._embedded?.payments || [];

        return lib.sendArrayOutput({ context, records: payments, outputType });
    }
};
