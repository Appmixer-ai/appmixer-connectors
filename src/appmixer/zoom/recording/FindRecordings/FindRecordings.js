'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { from, to, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Recordings', value: 'result' });
        }

        // Build query parameters
        const queryParams = {
            from,
            to,
            page_size: 300
        };

        // https://developers.zoom.us/docs/api/meetings/#tag/cloud-recording/GET/users/{userId}/recordings
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.zoom.us/v2/users/me/recordings',
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
    'uuid': { 'type': 'string', 'title': 'UUID' },
    'id': { 'type': 'string', 'title': 'Meeting ID' },
    'account_id': { 'type': 'string', 'title': 'Account ID' },
    'host_id': { 'type': 'string', 'title': 'Host ID' },
    'topic': { 'type': 'string', 'title': 'Topic' },
    'start_time': { 'type': 'string', 'title': 'Start Time' },
    'duration': { 'type': 'integer', 'title': 'Duration' },
    'total_size': { 'type': 'integer', 'title': 'Total Size' },
    'recording_count': { 'type': 'integer', 'title': 'Recording Count' },
    'recording_files': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Recording File ID' },
                'meeting_id': { 'type': 'string', 'title': 'Meeting ID' },
                'recording_start': { 'type': 'string', 'title': 'Recording Start' },
                'recording_end': { 'type': 'string', 'title': 'Recording End' },
                'file_type': { 'type': 'string', 'title': 'File Type' },
                'file_size': { 'type': 'integer', 'title': 'File Size' },
                'play_url': { 'type': 'string', 'title': 'Play URL' },
                'download_url': { 'type': 'string', 'title': 'Download URL' },
                'status': { 'type': 'string', 'title': 'Status' },
                'recording_type': { 'type': 'string', 'title': 'Recording Type' }
            }
        },
        'title': 'Recording Files'
    }
};
