'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'status': { 'type': 'string', 'title': 'Status' },
    'customer_id': { 'type': 'string', 'title': 'Customer Id' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'items': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'price_id': { 'type': 'string', 'title': 'Items.Price Id' },
                'quantity': { 'type': 'number', 'title': 'Items.Quantity' }
            }
        },
        'title': 'Items'
    },
    'currency_code': { 'type': 'string', 'title': 'Currency Code' }
};

module.exports = {
    async receive(context) {
        const { status, customer_id: customerId, createdAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Transactions', value: 'transactions' });
        }

        const params = {};

        if (status) {
            params.status = status;
        }

        if (customerId) {
            params.customer_id = customerId;
        }

        if (createdAfter) {
            params.created_at = { gt: createdAfter };
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.paddle.com/transactions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const transactions = data.data || [];

        if (transactions.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: transactions, outputType });
    }
};
