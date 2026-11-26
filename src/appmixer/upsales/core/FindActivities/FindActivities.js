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
            title: 'Task ID',
            example: 1
        },
        description: {
            type: 'string',
            title: 'Description',
            example: 'Book a meeting'
        },
        notes: {
            type: 'string',
            title: 'Notes',
            example: 'No answer, follow up tomorrow'
        },
        date: {
            type: 'string',
            title: 'Date',
            example: '2022-04-23'
        },
        time: {
            type: 'string',
            title: 'Time',
            example: '10:30'
        },
        closeDate: {
            type: 'string',
            title: 'Close Date',
            example: '2022-04-24'
        },
        priority: {
            type: 'integer',
            title: 'Priority',
            example: 3
        },
        isAppointment: {
            type: 'integer',
            title: 'Is Appointment',
            example: 0
        },
        activityType: {
            type: 'object',
            title: 'Task Type',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Task Type.ID',
                    example: 11
                },
                name: {
                    type: 'string',
                    title: 'Task Type.Name',
                    example: 'Phone call'
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
        users: {
            type: 'array',
            title: 'Users',
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
        contacts: {
            type: 'array',
            title: 'Contacts',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        title: 'ID',
                        example: 5
                    },
                    name: {
                        type: 'string',
                        title: 'Name',
                        example: 'Erlich Bachman'
                    }
                }
            },
            example: [
                {
                    id: 5,
                    name: 'Erlich Bachman'
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
            example: '2021-09-29T06:40:28.000Z'
        },
        modDate: {
            type: 'string',
            format: 'date-time',
            title: 'Modified At',
            example: '2021-09-29T06:40:28.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Tasks: GET /activities
    async receive(context) {

        const { type, companyId, dateFrom, dateTo, modifiedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tasks', value: 'result' });
        }

        const query = {
            'activityType.id': type && type !== 'all' ? await lib.taskTypeId(context, type) : undefined,
            'client.id': lib.toId(companyId),
            date: [
                dateFrom ? 'gte:' + lib.toDate(context, dateFrom, 'Date From') : undefined,
                dateTo ? 'lte:' + lib.toDate(context, dateTo, 'Date To') : undefined
            ],
            modDate: modifiedAfter ? 'gte:' + lib.toDateTime(context, modifiedAfter, 'Modified After') : undefined,
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/activities', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
