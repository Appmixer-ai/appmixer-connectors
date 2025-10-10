'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { conversationId, outputType } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Comments' });
        }

        // https://dev.frontapp.com/reference/list-conversation-comments
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/conversations/${conversationId}/comments`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return lib.sendArrayOutput({ context, records: data['_results'], outputType });
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
                    'conversation': { 'type': 'string', 'title': 'Links.Related.Conversation' },
                    'mentions': { 'type': 'string', 'title': 'Links.Related.Mentions' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    },
    'id': { 'type': 'string', 'title': 'Comment ID' },
    'body': { 'type': 'string', 'title': 'Body' },
    'posted_at': { 'type': 'number', 'title': 'Posted At' },
    'author': {
        'type': 'object',
        'properties': {
            '_links': {
                'type': 'object',
                'properties': {
                    'self': { 'type': 'string', 'title': 'Author.Links.Self' },
                    'related': {
                        'type': 'object',
                        'properties': {
                            'inboxes': { 'type': 'string', 'title': 'Author.Links.Related.Inboxes' },
                            'conversations': { 'type': 'string', 'title': 'Author.Links.Related.Conversations' }
                        },
                        'title': 'Author.Links.Related'
                    }
                },
                'title': 'Author.Links'
            },
            'id': { 'type': 'string', 'title': 'Author.Id' },
            'email': { 'type': 'string', 'title': 'Author.Email' },
            'username': { 'type': 'string', 'title': 'Author.Username' },
            'first_name': { 'type': 'string', 'title': 'Author.First Name' },
            'last_name': { 'type': 'string', 'title': 'Author.Last Name' },
            'is_admin': { 'type': 'boolean', 'title': 'Author.Is Admin' },
            'is_available': { 'type': 'boolean', 'title': 'Author.Is Available' },
            'is_blocked': { 'type': 'boolean', 'title': 'Author.Is Blocked' },
            'type': { 'type': 'string', 'title': 'Author.Type' },
            'custom_fields': { 'type': 'object', 'title': 'Author.Custom Fields' }
        },
        'title': 'Author'
    },
    'attachments': {
        'type': 'array',
        'items': { 'type': 'object' },
        'title': 'Attachments'
    },
    'is_pinned': { 'type': 'boolean', 'title': 'Is Pinned' }
};
