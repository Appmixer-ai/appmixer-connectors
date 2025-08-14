
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name':{ 'type':'string','title':'Name' },'driveDestination':{ 'type':'object','properties':{ 'fileId':{ 'type':'string','title':'Drive Destination.File Id' } },'title':'Drive Destination' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Recordings' });
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.recordings/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v2/conferenceRecords/{conferenceRecord}/recordings',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
