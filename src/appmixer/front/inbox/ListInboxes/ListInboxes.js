'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { teamId, outputType } = context.messages.in.content;

        if (!teamId) {
            throw new context.CancelError('Team ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Results' });
        }

        // https://dev.frontapp.com/reference/list-team-inboxes
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/teams/${teamId}/inboxes`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return lib.sendArrayOutput({ context, records: data['_results'], outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Inbox ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'type': { 'type': 'string', 'title': 'Type' },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'is_public': { 'type': 'boolean', 'title': 'Is Public' },
    'custom_fields': {
        'type': 'object',
        'title': 'Custom Fields',
        'properties': {
            'city': { 'type': 'string', 'title': 'City' },
            'isVIP': { 'type': 'boolean', 'title': 'Is VIP' },
            'renewal_date': { 'type': 'number', 'title': 'Renewal Date' },
            'sla_time': { 'type': 'number', 'title': 'SLA Time' },
            'owner': { 'type': 'string', 'title': 'Owner' },
            'replyTo': { 'type': 'string', 'title': 'Reply To' },
            'Job Title': { 'type': 'string', 'title': 'Job Title' }
        }
    },
    '_links': {
        'type': 'object',
        'title': 'Links',
        'properties': {
            'self': { 'type': 'string', 'title': 'Self Link' },
            'related': {
                'type': 'object',
                'title': 'Related Links',
                'properties': {
                    'teammates': { 'type': 'string', 'title': 'Teammates Link' },
                    'conversations': { 'type': 'string', 'title': 'Conversations Link' },
                    'channels': { 'type': 'string', 'title': 'Channels Link' },
                    'owner': { 'type': 'string', 'title': 'Owner Link' }
                }
            }
        }
    }
};
