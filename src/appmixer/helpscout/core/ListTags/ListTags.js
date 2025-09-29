
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'color':{ 'type':'string','title':'Color' } };

module.exports = {
    async receive(context) {

        const { page, pageSize, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags', value: 'tags' });
        }

        // Build query parameters
        const params = {};
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;

        // https://developer.helpscout.com/mailbox-api/endpoints/tags/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/tags',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data['_embedded']?.tags || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
