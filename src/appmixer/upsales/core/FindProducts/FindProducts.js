'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'id'
    ],
    properties: {
        id: {
            type: 'integer',
            title: 'Product ID',
            example: 2
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'SaaS product'
        },
        description: {
            type: 'string',
            title: 'Description',
            example: 'Yearly license'
        },
        articleNo: {
            type: 'string',
            title: 'Article Number',
            example: 'SAAS-01'
        },
        listPrice: {
            type: 'number',
            title: 'List Price',
            example: 20000
        },
        purchaseCost: {
            type: 'number',
            title: 'Purchase Cost',
            example: 5000
        },
        active: {
            type: 'integer',
            title: 'Active',
            example: 1
        },
        isRecurring: {
            type: 'integer',
            title: 'Is Recurring',
            example: 0
        },
        category: {
            type: 'object',
            title: 'Category',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Category.ID',
                    example: 2
                },
                name: {
                    type: 'string',
                    title: 'Category.Name',
                    example: 'Digital Ads'
                }
            }
        },
        custom: {
            type: 'array',
            title: 'Custom Fields',
            items: {
                type: 'object',
                properties: {
                    fieldId: {
                        type: 'integer',
                        title: 'Field ID',
                        example: 3
                    },
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: '2210'
                    }
                }
            },
            example: [
                {
                    fieldId: 3,
                    value: '2210'
                }
            ]
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Products: GET /products
    async receive(context) {

        const { name, active, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Products', value: 'result' });
        }

        const query = {
            name,
            active,
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/products', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
