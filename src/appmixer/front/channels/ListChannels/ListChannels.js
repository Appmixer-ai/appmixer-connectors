'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { teamId, outputType } = context.messages.in.content;

        if (!teamId) {
            throw new context.CancelError('Team ID is required.');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Channels' });
        }

        // https://dev.frontapp.com/reference/list-team-channels
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/teams/${teamId}/channels`,
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
                    'inbox': { 'type': 'string', 'title': 'Links.Related.Inbox' },
                    'owner': { 'type': 'string', 'title': 'Links.Related.Owner' }
                },
                'title': 'Links.Related'
            }
        },
        'title': 'Links'
    },
    'id': { 'type': 'string', 'title': 'Channel ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'address': { 'type': 'string', 'title': 'Address' },
    'send_as': { 'type': 'string', 'title': 'Send As' },
    'type': { 'type': 'string', 'title': 'Type' },
    'settings': {
        'type': 'object',
        'properties': {
            'undo_send_time': { 'type': 'number', 'title': 'Settings.Undo Send Time' },
            'all_teammates_can_reply': { 'type': 'boolean', 'title': 'Settings.All Teammates Can Reply' }
        },
        'title': 'Settings'
    },
    'is_private': { 'type': 'boolean', 'title': 'Is Private' },
    'is_valid': { 'type': 'boolean', 'title': 'Is Valid' }
};
