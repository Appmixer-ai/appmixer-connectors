'use strict';

const lib = require('../../lib.generated');
const schema = {
    'type': {
        'type': 'string',
        'title': 'Type'
    },
    'id': {
        'type': 'string',
        'title': 'Conversation Id'
    },
    'created_at': {
        'type': 'number',
        'title': 'Created At'
    },
    'updated_at': {
        'type': 'number',
        'title': 'Updated At'
    },
    'state': {
        'type': 'string',
        'title': 'State'
    },
    'open': {
        'type': 'boolean',
        'title': 'Open'
    },
    'admin_assignee_id': {
        'type': 'number',
        'title': 'Admin Assignee Id'
    },
    'team_assignee_id': {
        'type': 'string',
        'title': 'Team Assignee Id'
    },
    'priority': {
        'type': 'string',
        'title': 'Priority'
    },
    'read': {
        'type': 'boolean',
        'title': 'Read'
    },
    'source': {
        'type': 'object',
        'properties': {
            'type': {
                'type': 'string',
                'title': 'Source.Type'
            },
            'subject': {
                'type': 'string',
                'title': 'Subject'
            },
            'body': {
                'type': 'string',
                'title': 'Body'
            },
            'author': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'title': 'Author Name'
                    },
                    'email': {
                        'type': 'string',
                        'title': 'Author Email'
                    }
                }
            }
        }
    },
    'tags': {
        'type': 'object',
        'properties': {
            'tags': {
                'type': 'array',
                'items': {
                    'type': 'string'
                },
                'title': 'Tags'
            }
        }
    },
    'custom_attributes': {
        'type': 'object',
        'properties': {
            'Language': {
                'type': 'string',
                'title': 'Language'
            },
            'Has attachments': {
                'type': 'boolean',
                'title': 'Has Attachments'
            },
            'Auto-translated': {
                'type': 'boolean',
                'title': 'Auto-translated'
            }
        }
    }
};

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Conversations' });
        }

        // Parse query for search
        let parsedQuery;
        try {
            parsedQuery = typeof query === 'string' ? JSON.parse(query) : query;
        } catch (error) {
            throw new context.CancelError('Invalid JSON query format. Please provide a valid JSON query object.');
        }

        const requestBody = {
            query: parsedQuery
        };

        // https://developers.intercom.com/reference#search-conversations
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/conversations/search',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        const records = data.conversations || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
