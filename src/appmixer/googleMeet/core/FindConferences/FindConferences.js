
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name':{ 'type':'string','title':'Name' },'space':{ 'type':'string','title':'Space' },'startTime':{ 'type':'string','title':'Start Time' },'endTime':{ 'type':'string','title':'End Time' } };

module.exports = {
    async receive(context) {

        const { filter, orderBy, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'ConferenceRecords' });
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v2/conferenceRecords',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
