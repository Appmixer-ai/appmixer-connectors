'use strict';

const lib = require('../../lib');

const schema = {
    id: {
        type: 'string',
        title: 'Product Id'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    tax_category: {
        type: 'string',
        title: 'Tax Category'
    },
    type: {
        type: 'string',
        title: 'Type'
    },
    description: {
        type: 'string',
        title: 'Description'
    },
    image_url: {
        type: 'string',
        title: 'Image Url'
    },
    custom_data: {
        type: 'null',
        title: 'Custom Data'
    },
    status: {
        type: 'string',
        title: 'Status'
    },
    import_meta: {
        type: 'null',
        title: 'Import Meta'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    }
};

module.exports = {
    async receive(context) {

        const {
            id, status, tax_category: taxCategory, type, outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Products', value: 'products' });
        }

        const params = {
            include: ['prices'],
            order_by: 'id[DESC]',
            per_page: 200
        };

        if (id) {
            // Normalize multiselect input for id field
            const normalizedIds = lib.normalizeMultiselectInput(id, context, 'Product IDs');
            if (normalizedIds.length > 0) {
                params.id = normalizedIds;
            }
        }

        if (status) {
            // Normalize multiselect input for status field
            const normalizedStatus = lib.normalizeMultiselectInput(status, context, 'Status');
            if (normalizedStatus.length > 0) {
                params.status = normalizedStatus;
            }
        }

        if (taxCategory) {
            // Normalize multiselect input for tax_category field
            const normalizedTaxCategory = lib.normalizeMultiselectInput(taxCategory, context, 'Tax Category');
            if (normalizedTaxCategory.length > 0) {
                params.tax_category = normalizedTaxCategory;
            }
        }

        if (type) {
            params.type = type;
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
