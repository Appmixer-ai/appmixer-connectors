
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name': { 'type': 'string', 'title': 'Name' }, 'space': { 'type': 'string', 'title': 'Space' }, 'startTime': { 'type': 'string', 'title': 'Start Time' }, 'endTime': { 'type': 'string', 'title': 'End Time' } };

module.exports = {
    async receive(context) {

        const { filter, orderBy, outputType } = context.messages.in.content || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'ConferenceRecords' });
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://meet.googleapis.com/v2/conferenceRecords',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: { filter, orderBy }
        });

        const records = data.conferenceRecords || data.items || data.records || [];
        if (!records.length) {
            // conventional notFound port not defined here; return empty array
            return lib.sendArrayOutput({ context, records: [], outputType });
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
