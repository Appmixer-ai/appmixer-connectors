
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name':{ 'type':'string','title':'Name' },'startTime':{ 'type':'string','title':'Start Time' },'endTime':{ 'type':'string','title':'End Time' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, participant, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'ParticipantSessions' });
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.participants.participantSessions/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v2/conferenceRecords/{conferenceRecord}/participants/{participant}/participantSessions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
