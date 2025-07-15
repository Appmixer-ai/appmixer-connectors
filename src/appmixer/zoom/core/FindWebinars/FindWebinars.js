
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'topic':{ 'type':'string','title':'Topic' },'start_time':{ 'type':'string','title':'Start Time' } };

module.exports = {
    async receive(context) {

        const { userId = 'me', outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'webinars', value: 'webinars' });
        }

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/webinar/webinarlist
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.zoom.us/v2/users/${userId}/webinars`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const records = data.webinars || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
