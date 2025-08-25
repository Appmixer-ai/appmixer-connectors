
'use strict';

const lib = require('../../lib.generated');

const schema = {
    'type': { 'type': 'string', 'title': 'Stream Type' },
    'data': { 'type': 'array', 'title': 'Stream Data', 'items': { 'type': 'number' } },
    'series_type': { 'type': 'string', 'title': 'Series Type' },
    'original_size': { 'type': 'number', 'title': 'Original Size' },
    'resolution': { 'type': 'string', 'title': 'Resolution' }
};

module.exports = {

    async receive(context) {

        const { activityId, keys, outputType } = context.messages.in.content;

        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Activity Streams' });
        }

        // Validate required fields
        if (!activityId) {
            throw new context.CancelError('Activity ID is required!');
        }
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            throw new context.CancelError('At least one stream key must be selected!');
        }

        // Build the keys parameter (comma-separated string from array)
        const keysParam = keys.join(',');

        // Get activity streams using Strava API
        // https://developers.strava.com/docs/reference/#api-Streams-getActivityStreams
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://www.strava.com/api/v3/activities/${activityId}/streams`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                keys: keysParam,
                key_by_type: true
            }
        });

        if (data.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: data, outputType });
    }
};
