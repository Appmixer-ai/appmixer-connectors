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
            title: 'Contact ID',
            example: 7
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Erlich Bachman'
        },
        firstName: {
            type: 'string',
            title: 'First Name',
            example: 'Erlich'
        },
        lastName: {
            type: 'string',
            title: 'Last Name',
            example: 'Bachman'
        },
        email: {
            type: 'string',
            title: 'Email',
            example: 'erlich.bachman@piedpiper.com'
        },
        phone: {
            type: 'string',
            title: 'Phone',
            example: '08-860 804 04'
        },
        cellPhone: {
            type: 'string',
            title: 'Mobile Phone',
            example: '0732231312'
        },
        title: {
            type: 'string',
            title: 'Title',
            example: 'Software designer'
        },
        notes: {
            type: 'string',
            title: 'Notes',
            example: 'Met at the conference'
        },
        active: {
            type: 'integer',
            title: 'Active',
            example: 1
        },
        score: {
            type: 'integer',
            title: 'Score',
            example: 0
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
            example: '2018-04-22T15:31:02.000Z'
        },
        modDate: {
            type: 'string',
            format: 'date-time',
            title: 'Modified At',
            example: '2018-04-22T15:31:02.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Contacts: GET /contacts
    async receive(context) {

        const { email, companyId, modifiedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Contacts', value: 'result' });
        }

        const query = {
            email,
            'client.id': lib.toId(companyId),
            modDate: modifiedAfter ? 'gte:' + lib.toDateTime(context, modifiedAfter, 'Modified After') : undefined,
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/contacts', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
