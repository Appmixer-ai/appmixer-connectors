'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'item_id': { 'type': 'string', 'title': 'Task ID' },
    'type': { 'type': 'string', 'title': 'Type' },
    'due': {
        'type': 'object',
        'title': 'Due',
        'properties': {
            'string': { 'type': 'string', 'title': 'Due String' },
            'date': { 'type': 'string', 'title': 'Due Date' },
            'datetime': { 'type': 'string', 'title': 'Due Datetime' },
            'timezone': { 'type': 'string', 'title': 'Due Timezone' }
        }
    },
    'minute_offset': { 'type': 'integer', 'title': 'Minute Offset' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return context.sendJson(lib.getOutputPortSchema(schema, outputType || 'array', 'Reminders'), 'out');
        }

        // Use Sync API to get reminders
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.todoist.com/sync/v9/sync',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                sync_token: '*',
                resource_types: ['reminders']
            }
        });

        const reminders = response.data.reminders || [];

        return lib.sendArrayOutput({
            context,
            outputType: outputType || 'array',
            records: reminders
        });
    }
};
