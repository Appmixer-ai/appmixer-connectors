
'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { status, outputType } = context.messages.in.content;

        // Normalize multiselect inputs
        const normalizedStatuses = status ?
            lib.normalizeMultiselectInput(status, 4, context, 'Status') : undefined;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Conversations' });
        }

        const queryString = {};

        if (normalizedStatuses) {
            queryString['q[statuses][]'] = normalizedStatuses;
        }

        // https://dev.frontapp.com/reference/list-conversations
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: queryString
        });

        const records = data['_results'] || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};

const schema = {
    '_links': {
        'type': 'object',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' },
            'related': {
                'type': 'object',
                'properties': {
                    'events': { 'type': 'string', 'title': 'Links.Related.Events' },
                    'followers': { 'type': 'string', 'title': 'Links.Related.Followers' },
                    'messages': { 'type': 'string', 'title': 'Links.Related.Messages' },
                    'comments': { 'type': 'string', 'title': 'Links.Related.Comments' },
                    'inboxes': { 'type': 'string', 'title': 'Links.Related.Inboxes' },
                    'last_message': { 'type': 'string', 'title': 'Links.Related.Last Message' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    },
    'id': { 'type': 'string', 'title': 'Conversation ID' },
    'subject': { 'type': 'string', 'title': 'Subject' },
    'status': { 'type': 'string', 'title': 'Status' },
    'status_id': { 'type': 'string', 'title': 'Status Id' },
    'status_category': { 'type': 'string', 'title': 'Status Category' },
    'ticket_ids': {
        'type': 'array',
        'items': { 'type': 'string' },
        'title': 'Ticket Ids'
    },
    'assignee': {
        'type': 'object',
        'properties': {
            '_links': {
                'type': 'object',
                'properties': {
                    'self': { 'type': 'string', 'title': 'Assignee.Links.Self' },
                    'related': {
                        'type': 'object',
                        'properties': {
                            'inboxes': { 'type': 'string', 'title': 'Assignee.Links.Related.Inboxes' },
                            'conversations': { 'type': 'string', 'title': 'Assignee.Links.Related.Conversations' }
                        },
                        'title': 'Assignee.Links.Related'
                    }
                },
                'title': 'Assignee.Links'
            },
            'id': { 'type': 'string', 'title': 'Assignee.Id' },
            'email': { 'type': 'string', 'title': 'Assignee.Email' },
            'username': { 'type': 'string', 'title': 'Assignee.Username' },
            'first_name': { 'type': 'string', 'title': 'Assignee.First Name' },
            'last_name': { 'type': 'string', 'title': 'Assignee.Last Name' },
            'is_admin': { 'type': 'boolean', 'title': 'Assignee.Is Admin' },
            'is_available': { 'type': 'boolean', 'title': 'Assignee.Is Available' },
            'is_blocked': { 'type': 'boolean', 'title': 'Assignee.Is Blocked' },
            'type': { 'type': 'string', 'title': 'Assignee.Type' },
            'custom_fields': { 'type': 'object', 'title': 'Assignee.Custom Fields' }
        },
        'title': 'Assignee'
    },
    'recipient': {
        'type': 'object',
        'properties': {
            '_links': {
                'type': 'object',
                'properties': {
                    'related': {
                        'type': 'object',
                        'properties': {
                            'contact': { 'type': 'string', 'title': 'Recipient.Links.Related.Contact' }
                        },
                        'title': 'Recipient.Links.Related'
                    }
                },
                'title': 'Recipient.Links'
            },
            'name': { 'type': 'string', 'title': 'Recipient.Name' },
            'handle': { 'type': 'string', 'title': 'Recipient.Handle' },
            'role': { 'type': 'string', 'title': 'Recipient.Role' }
        },
        'title': 'Recipient'
    },
    'tags': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                '_links': {
                    'type': 'object',
                    'properties': {
                        'self': { 'type': 'string', 'title': 'Tags.Links.Self' },
                        'related': {
                            'type': 'object',
                            'properties': {
                                'conversations': { 'type': 'string', 'title': 'Tags.Links.Related.Conversations' },
                                'owner': { 'type': 'string', 'title': 'Tags.Links.Related.Owner' },
                                'parent_tag': { 'type': 'string', 'title': 'Tags.Links.Related.Parent Tag' },
                                'children': { 'type': 'string', 'title': 'Tags.Links.Related.Children' }
                            },
                            'title': 'Tags.Links.Related'
                        }
                    },
                    'title': 'Tags.Links'
                },
                'id': { 'type': 'string', 'title': 'Tags.Id' },
                'name': { 'type': 'string', 'title': 'Tags.Name' },
                'highlight': { 'type': 'string', 'title': 'Tags.Highlight' },
                'description': { 'type': 'string', 'title': 'Tags.Description' },
                'is_private': { 'type': 'boolean', 'title': 'Tags.Is Private' },
                'is_visible_in_conversation_lists': { 'type': 'boolean', 'title': 'Tags.Is Visible In Conversation Lists' },
                'updated_at': { 'type': 'number', 'title': 'Tags.Updated At' },
                'created_at': { 'type': 'number', 'title': 'Tags.Created At' }
            }
        },
        'title': 'Tags'
    },
    'links': {
        'type': 'array',
        'items': { 'type': 'object' },
        'title': 'Links'
    },
    'custom_fields': { 'type': 'object', 'title': 'Custom Fields' },
    'created_at': { 'type': 'number', 'title': 'Created At' },
    'waiting_since': { 'type': 'number', 'title': 'Waiting Since' },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'scheduled_reminders': {
        'type': 'array',
        'items': { 'type': 'object' },
        'title': 'Scheduled Reminders'
    },
    'metadata': { 'type': 'object', 'title': 'Metadata' }
};
