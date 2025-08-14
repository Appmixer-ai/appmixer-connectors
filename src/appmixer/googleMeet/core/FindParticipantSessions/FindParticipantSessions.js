
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name': { 'type': 'string', 'title': 'Name' }, 'startTime': { 'type': 'string', 'title': 'Start Time' }, 'endTime': { 'type': 'string', 'title': 'End Time' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, participant, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Participant Sessions' });
        }

        if (!conferenceRecord) {
            throw new context.CancelError('Conference record is required!');
        }
        if (!participant) {
            throw new context.CancelError('Participant is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.participants.participantSessions/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(conferenceRecord)}/participants/${encodeURIComponent(participant)}/participantSessions`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const records = data.participantSessions || data.items || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
