
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name':{ 'type':'string','title':'Name' },'participant':{ 'type':'string','title':'Participant' },'startTime':{ 'type':'string','title':'Start Time' },'endTime':{ 'type':'string','title':'End Time' },'text':{ 'type':'string','title':'Text' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, transcript, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Entries' });
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts.entries/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v2/conferenceRecords/{conferenceRecord}/transcripts/{transcript}/entries',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
