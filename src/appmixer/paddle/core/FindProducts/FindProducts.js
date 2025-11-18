'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'tax_category': { 'type': 'string', 'title': 'Tax Category' },
    'status': { 'type': 'string', 'title': 'Status' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {
    async receive(context) {

        const { name, status, tax_category: taxCategory, updated_after: updatedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Products', value: 'products' });
        }

        const params = {};

        if (name) {
            params.search = name;
        }

        if (status) {
            params.status = status;
        }

        if (taxCategory) {
            params.tax_category = taxCategory;
        }

        if (updatedAfter) {
            params.updated_after = updatedAfter;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.paddle.com/products',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params
        });

        const products = data.data || [];

        if (products.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: products, outputType });
    }
};
