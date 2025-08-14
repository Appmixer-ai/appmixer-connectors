
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name': { 'type': 'string', 'title': 'Name' }, 'participant': { 'type': 'string', 'title': 'Participant' }, 'startTime': { 'type': 'string', 'title': 'Start Time' }, 'endTime': { 'type': 'string', 'title': 'End Time' }, 'text': { 'type': 'string', 'title': 'Text' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, transcript, outputType } = context.messages.in.content || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Entries' });
        }

        if (!conferenceRecord) {
            throw new context.CancelError('Conference record is required!');
        }
        if (!transcript) {
            throw new context.CancelError('Transcript is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts.entries/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(conferenceRecord)}/transcripts/${encodeURIComponent(transcript)}/entries`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const records = data.entries || data.items || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
