
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name': { 'type': 'string', 'title': 'Name' }, 'state': { 'type': 'string', 'title': 'State' }, 'startTime': { 'type': 'string', 'title': 'Start Time' }, 'endTime': { 'type': 'string', 'title': 'End Time' }, 'languageCode': { 'type': 'string', 'title': 'Language Code' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, outputType } = context.messages.in.content || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Transcripts' });
        }

        if (!conferenceRecord) {
            throw new context.CancelError('Conference record is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(conferenceRecord)}/transcripts`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const records = data.transcripts || data.items || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
