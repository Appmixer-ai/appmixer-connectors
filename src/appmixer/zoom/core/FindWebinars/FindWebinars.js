'use strict';

const lib = require('../../lib.generated');

module.exports = {
    async receive(context) {

        const { type, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Webinars', value: 'result' });
        }

        // Build query parameters
        const queryParams = {
            type,
            page_size: 300
        };

        // https://developers.zoom.us/docs/api/meetings/#tag/webinars/GET/users/{userId}/webinars
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.zoom.us/v2/users/me/webinars`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: queryParams
        });

        const records = data.webinars;

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Webinar ID' },
    'uuid': { 'type': 'string', 'title': 'Webinar UUID' },
    'host_id': { 'type': 'string', 'title': 'Host ID' },
    'topic': { 'type': 'string', 'title': 'Topic' },
    'type': { 'type': 'integer', 'title': 'Webinar Type' },
    'start_time': { 'type': 'string', 'title': 'Start Time' },
    'duration': { 'type': 'integer', 'title': 'Duration (minutes)' },
    'timezone': { 'type': 'string', 'title': 'Timezone' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'join_url': { 'type': 'string', 'title': 'Join URL' },
    'registration_url': { 'type': 'string', 'title': 'Registration URL' }
};
