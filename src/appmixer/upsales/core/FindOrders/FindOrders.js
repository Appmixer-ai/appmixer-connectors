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
            title: 'Order ID',
            example: 2
        },
        description: {
            type: 'string',
            title: 'Description',
            example: '10 licenses'
        },
        date: {
            type: 'string',
            title: 'Date',
            example: '2018-07-23'
        },
        closeDate: {
            type: 'string',
            title: 'Close Date',
            example: '2018-07-30'
        },
        notes: {
            type: 'string',
            title: 'Notes',
            example: 'Decision in Q3'
        },
        probability: {
            type: 'integer',
            title: 'Probability',
            example: 25
        },
        value: {
            type: 'number',
            title: 'Value',
            example: 10000
        },
        weightedValue: {
            type: 'number',
            title: 'Weighted Value',
            example: 2500
        },
        currency: {
            type: 'string',
            title: 'Currency',
            example: 'SEK'
        },
        user: {
            type: 'object',
            title: 'User',
            properties: {
                id: {
                    type: 'integer',
                    title: 'User.ID',
                    example: 1
                },
                name: {
                    type: 'string',
                    title: 'User.Name',
                    example: 'Gustav Petterson'
                },
                email: {
                    type: 'string',
                    title: 'User.Email',
                    example: 'gustav@example.com'
                }
            }
        },
        client: {
            type: 'object',
            title: 'Company',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Company.ID',
                    example: 2
                },
                name: {
                    type: 'string',
                    title: 'Company.Name',
                    example: 'Pied Piper'
                }
            }
        },
        contact: {
            type: 'object',
            title: 'Contact',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Contact.ID',
                    example: 5
                },
                name: {
                    type: 'string',
                    title: 'Contact.Name',
                    example: 'Erlich Bachman'
                }
            }
        },
        stage: {
            type: 'object',
            title: 'Stage',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Stage.ID',
                    example: 9
                },
                name: {
                    type: 'string',
                    title: 'Stage.Name',
                    example: 'Prospect 1'
                }
            }
        },
        orderRow: {
            type: 'array',
            title: 'Order Rows',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        title: 'ID',
                        example: 2
                    },
                    quantity: {
                        type: 'number',
                        title: 'Quantity',
                        example: 1
                    },
                    price: {
                        type: 'number',
                        title: 'Price',
                        example: 9000
                    },
                    listPrice: {
                        type: 'number',
                        title: 'List Price',
                        example: 10000
                    },
                    discount: {
                        type: 'number',
                        title: 'Discount',
                        example: 0
                    },
                    productId: {
                        type: 'integer',
                        title: 'Product ID',
                        example: 1
                    }
                }
            },
            example: [
                {
                    id: 2,
                    quantity: 1,
                    price: 9000,
                    listPrice: 10000,
                    discount: 0,
                    productId: 1
                }
            ]
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
        },
        regDate: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2018-05-22T11:15:30.000Z'
        },
        modDate: {
            type: 'string',
            format: 'date-time',
            title: 'Modified At',
            example: '2018-05-22T11:15:30.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Opportunity / Order: GET /orders (probability=gte:1&probability=lte:99 for opportunities, probability=100 for orders)
    async receive(context) {

        const {
            type,
            stageId,
            companyId,
            userId,
            dateFrom,
            dateTo,
            modifiedAfter,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Orders', value: 'result' });
        }

        const query = {
            probability: lib.probabilityFilter(type),
            'stage.id': lib.toId(stageId),
            'client.id': lib.toId(companyId),
            'user.id': lib.toId(userId),
            date: [
                dateFrom ? 'gte:' + lib.toDate(context, dateFrom, 'Date From') : undefined,
                dateTo ? 'lte:' + lib.toDate(context, dateTo, 'Date To') : undefined
            ],
            modDate: modifiedAfter ? 'gte:' + lib.toDateTime(context, modifiedAfter, 'Modified After') : undefined,
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/orders', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
