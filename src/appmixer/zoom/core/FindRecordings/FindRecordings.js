
'use strict';

const lib = require('../../lib.generated');
const schema = { 'meeting_id':{ 'type':'string','title':'Meeting Id' },'recording_files':{ 'type':'array','items':{ 'type':'object','properties':{ 'id':{ 'type':'string','title':'Recording Files.Id' },'file_type':{ 'type':'string','title':'Recording Files.File Type' },'download_url':{ 'type':'string','title':'Recording Files.Download Url' } } },'title':'Recording Files' } };

module.exports = {
    async receive(context) {

        const { userId = 'me', from, to, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'recordings', value: 'recordings' });
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (from) queryParams.append('from', from);
        if (to) queryParams.append('to', to);

        const queryString = queryParams.toString();
        const url = `https://api.zoom.us/v2/users/${userId}/recordings${queryString ? '?' + queryString : ''}`;

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/recording/recordinglist
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const records = data.meetings || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
