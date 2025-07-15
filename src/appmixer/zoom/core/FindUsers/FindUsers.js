
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'first_name':{ 'type':'string','title':'First Name' },'last_name':{ 'type':'string','title':'Last Name' },'email':{ 'type':'string','title':'Email' } };

module.exports = {
    async receive(context) {

        const { query, status = 'active', outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'users', value: 'users' });
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        if (query) queryParams.append('role_type', query);

        const queryString = queryParams.toString();
        const url = `https://api.zoom.us/v2/users${queryString ? '?' + queryString : ''}`;

        // https://marketplace.zoom.us/docs/api-reference/zoom-api/users/users
        const { data } = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const records = data.users || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
