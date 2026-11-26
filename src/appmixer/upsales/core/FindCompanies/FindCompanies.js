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
            title: 'Company ID',
            example: 2
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Pied Piper'
        },
        phone: {
            type: 'string',
            title: 'Phone',
            example: '+46 8 123 456'
        },
        fax: {
            type: 'string',
            title: 'Fax',
            example: '+46 8 123 457'
        },
        webpage: {
            type: 'string',
            title: 'Web Page',
            example: 'https://piedpiper.com'
        },
        notes: {
            type: 'string',
            title: 'Notes',
            example: 'Key account'
        },
        orgNo: {
            type: 'string',
            title: 'Organization Number',
            example: '556677-8899'
        },
        active: {
            type: 'integer',
            title: 'Active',
            example: 1
        },
        journeyStep: {
            type: 'string',
            title: 'Journey Step',
            example: 'lead'
        },
        score: {
            type: 'integer',
            title: 'Score',
            example: 0
        },
        isExternal: {
            type: 'integer',
            title: 'Is External',
            example: 0
        },
        users: {
            type: 'array',
            title: 'Account Managers',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        title: 'ID',
                        example: 1
                    },
                    name: {
                        type: 'string',
                        title: 'Name',
                        example: 'Gustav Petterson'
                    },
                    email: {
                        type: 'string',
                        title: 'Email',
                        example: 'gustav@example.com'
                    }
                }
            },
            example: [
                {
                    id: 1,
                    name: 'Gustav Petterson',
                    email: 'gustav@example.com'
                }
            ]
        },
        categories: {
            type: 'array',
            title: 'Categories',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        title: 'ID',
                        example: 4
                    },
                    name: {
                        type: 'string',
                        title: 'Name',
                        example: 'Partner'
                    }
                }
            },
            example: [
                {
                    id: 4,
                    name: 'Partner'
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
            example: '2021-09-29T05:59:05.000Z'
        },
        modDate: {
            type: 'string',
            format: 'date-time',
            title: 'Modified At',
            example: '2021-09-29T05:59:05.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Company: GET /accounts (filters: attribute=comparison:value)
    async receive(context) {

        const { name, userId, modifiedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Companies', value: 'result' });
        }

        const query = {
            isExternal: 0,
            name,
            'user.id': lib.toId(userId),
            modDate: modifiedAfter ? 'gte:' + lib.toDateTime(context, modifiedAfter, 'Modified After') : undefined,
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/accounts', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
