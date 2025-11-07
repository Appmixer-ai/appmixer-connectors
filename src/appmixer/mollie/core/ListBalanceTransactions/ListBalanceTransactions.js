'use strict';

const lib = require('../../lib');

const schema = {
    'resource': { 'type': 'string', 'title': 'Resource' },
    'id': { 'type': 'string', 'title': 'Id' },
    'type': { 'type': 'string', 'title': 'Type' },
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

        const { balanceId, fromDate, toDate, type, testmode, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Transactions', value: 'transactions' });
        }

        if (!balanceId) {
            throw new context.CancelError('Balance Id is required!');
        }

        // https://docs.mollie.com/reference/v2/balances-api/list-balance-transactions
        const params = {};

        if (fromDate) {
            params.from = fromDate;
        }
        if (toDate) {
            params.to = toDate;
        }
        if (type) {
            params.type = type;
        }
        if (testmode) {
            params.testmode = testmode;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/balances/${balanceId}/transactions`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        const transactions = data._embedded?.transactions || [];

        return lib.sendArrayOutput({ context, records: transactions, outputType });
    }
};
