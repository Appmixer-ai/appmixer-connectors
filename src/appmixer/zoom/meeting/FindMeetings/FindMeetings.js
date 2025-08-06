'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { type, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Meetings', value: 'result' });
        }

        // Build query parameters
        const queryParams = {
            type,
            page_size: 300
        };

        // https://developers.zoom.us/docs/api/meetings/#tag/meetings/GET/users/{userId}/meetings
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.zoom.us/v2/users/me/meetings',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: queryParams
        });

        const records = data.meetings;

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Meeting ID' },
    'agenda': { 'type': 'string', 'title': 'Agenda' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'duration': { 'type': 'integer', 'title': 'Duration (minutes)' },
    'host_id': { 'type': 'string', 'title': 'Host ID' },
    'join_url': { 'type': 'string', 'title': 'Join URL' },
    'pmi': { 'type': 'string', 'title': 'Personal Meeting ID' },
    'start_time': { 'type': 'string', 'title': 'Start Time' },
    'timezone': { 'type': 'string', 'title': 'Timezone' },
    'topic': { 'type': 'string', 'title': 'Topic' },
    'type': { 'type': 'integer', 'title': 'Meeting Type' },
    'uuid': { 'type': 'string', 'title': 'Meeting UUID' }
};
