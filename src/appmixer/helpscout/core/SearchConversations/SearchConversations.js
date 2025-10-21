
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'number':{ 'type':'number','title':'Number' },'subject':{ 'type':'string','title':'Subject' },'status':{ 'type':'string','title':'Status' } };

module.exports = {
    async receive(context) {

        const { query, page, pageSize, sortBy, sortOrder, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Conversations' });
        }

        if (!query) {
            throw new context.CancelError('Search query is required.');
        }

        // Build query parameters
        const params = { query };
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;
        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;

        // Use conversations endpoint with search functionality
        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data['_embedded']?.conversations || [];
        
        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        
        return await lib.sendArrayOutput({ context, records, outputType });
    }
};
