'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { filter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Conference Records' });
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://meet.googleapis.com/v2/conferenceRecords',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: { filter }
        });

        const records = data.conferenceRecords;
        if (!records || !records.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};

const schema = {
    'name': { 'type': 'string', 'title': 'Conference Record ID' },
    'space': { 'type': 'string', 'title': 'Space ID' },
    'startTime': { 'type': 'string', 'title': 'Start Time' },
    'endTime': { 'type': 'string', 'title': 'End Time' },
    'expireTime': { 'type': 'string', 'title': 'Expire Time' }
};
