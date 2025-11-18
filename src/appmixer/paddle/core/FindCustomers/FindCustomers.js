'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'email': { 'type': 'string', 'title': 'Email' },
    'name': { 'type': 'string', 'title': 'Name' },
    'status': { 'type': 'string', 'title': 'Status' },
    'marketing_consent': { 'type': 'boolean', 'title': 'Marketing Consent' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {
    async receive(context) {

        const { email, name, status, createdAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers', value: 'customers' });
        }

        const params = {};

        if (email) {
            params.search = email;
        }

        if (name) {
            params.search = name;
        }

        if (status) {
            params.status = status;
        }

        if (createdAfter) {
            params.created_at = {
                gte: createdAfter
            };
        }

        // https://developer.paddle.com/api-reference/customers/list-customers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.paddle.com/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const customers = data.data || [];

        if (customers.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: customers, outputType });
    }
};
