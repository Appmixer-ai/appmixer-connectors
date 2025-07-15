
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'topic':{ 'type':'string','title':'Topic' },'start_time':{ 'type':'string','title':'Start Time' } };

module.exports = {
    async receive(context) {

        const { userId = 'me', type = 'upcoming', outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'meetings', value: 'meetings' });
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (type) queryParams.append('type', type);

        const queryString = queryParams.toString();
        const url = `https://api.zoom.us/v2/users/${userId}/meetings${queryString ? '?' + queryString : ''}`;

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetinglist
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
