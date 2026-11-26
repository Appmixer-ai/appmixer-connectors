'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'id',
        'title'
    ],
    properties: {
        id: {
            type: 'integer',
            title: 'Ticket ID',
            example: 101
        },
        title: {
            type: 'string',
            title: 'Title',
            example: 'Cannot log in to the mobile app'
        },
        status: {
            type: 'object',
            title: 'Status',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Status.ID',
                    example: 1
                },
                name: {
                    type: 'string',
                    title: 'Status.Name',
                    example: 'Open'
                }
            }
        },
        type: {
            type: 'object',
            title: 'Type',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Type.ID',
                    example: 1
                },
                name: {
                    type: 'string',
                    title: 'Type.Name',
                    example: 'Question'
                }
            }
        },
        user: {
            type: 'object',
            title: 'Assigned User',
            properties: {
                id: {
                    type: 'integer',
                    title: 'Assigned User.ID',
                    example: 5
                },
                name: {
                    type: 'string',
                    title: 'Assigned User.Name',
                    example: 'Gustav Petterson'
                },
                email: {
                    type: 'string',
                    title: 'Assigned User.Email',
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
                    example: 12
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
                    example: 340
                },
                name: {
                    type: 'string',
                    title: 'Contact.Name',
                    example: 'Erlich Bachman'
                }
            }
        },
        priority: {
            type: 'integer',
            title: 'Priority',
            example: 0
        },
        source: {
            type: 'string',
            title: 'Source',
            example: 'manual'
        },
        isArchived: {
            type: 'boolean',
            title: 'Archived',
            example: false
        },
        isPending: {
            type: 'boolean',
            title: 'Pending',
            example: false
        },
        isRead: {
            type: 'boolean',
            title: 'Read',
            example: true
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
                        example: 1
                    },
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: 'Mobile'
                    }
                }
            },
            example: [
                {
                    fieldId: 1,
                    value: 'Mobile'
                }
            ]
        },
        comments: {
            type: 'array',
            title: 'Comments',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        title: 'ID',
                        example: 41
                    },
                    description: {
                        type: 'string',
                        title: 'Description',
                        example: 'We have reset the account, please try again.'
                    },
                    isPublic: {
                        type: 'boolean',
                        title: 'Public',
                        example: true
                    },
                    regDate: {
                        type: 'string',
                        format: 'date-time',
                        title: 'Created At',
                        example: '2026-05-12T09:14:00.000Z'
                    }
                }
            },
            example: [
                {
                    id: 41,
                    description: 'We have reset the account, please try again.',
                    isPublic: true,
                    regDate: '2026-05-12T09:14:00.000Z'
                }
            ]
        },
        regDate: {
            type: 'string',
            format: 'date-time',
            title: 'Created At',
            example: '2026-05-12T09:00:00.000Z'
        },
        modDate: {
            type: 'string',
            format: 'date-time',
            title: 'Modified At',
            example: '2026-05-12T09:14:00.000Z'
        },
        resolveDate: {
            type: 'string',
            format: 'date-time',
            title: 'Resolved At',
            example: '2026-05-13T10:00:00.000Z'
        },
        firstReplyDate: {
            type: 'string',
            format: 'date-time',
            title: 'First Reply At',
            example: '2026-05-12T09:14:00.000Z'
        },
        snoozeDate: {
            type: 'string',
            format: 'date-time',
            title: 'Snoozed Until',
            example: '2026-05-20T08:00:00.000Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Support tickets: GET /tickets
    async receive(context) {

        const { statusId, companyId, contactId, userId, modifiedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tickets', value: 'result' });
        }

        const query = {
            'status.id': lib.toId(statusId),
            'client.id': lib.toId(companyId),
            'contact.id': lib.toId(contactId),
            'user.id': lib.toId(userId),
            modDate: modifiedAfter ? 'gte:' + lib.toDateTime(context, modifiedAfter, 'Modified After') : undefined,
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/tickets', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
