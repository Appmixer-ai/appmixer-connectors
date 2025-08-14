
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name':{ 'type':'string','title':'Name' },'state':{ 'type':'string','title':'State' },'startTime':{ 'type':'string','title':'Start Time' },'endTime':{ 'type':'string','title':'End Time' },'languageCode':{ 'type':'string','title':'Language Code' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Transcripts' });
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v2/conferenceRecords/{conferenceRecord}/transcripts',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
