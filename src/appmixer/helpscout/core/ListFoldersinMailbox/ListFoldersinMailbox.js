
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'type':{ 'type':'string','title':'Type' },'userId':{ 'type':'null','title':'User Id' } };

module.exports = {
    async receive(context) {

        const { mailboxId, page, pageSize, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Folders', value: 'folders' });
        }

        if (!mailboxId) {
            throw new context.CancelError('Mailbox ID is required!');
        }

        // Build query parameters
        const params = {};
        if (page) params.page = page;
        if (pageSize) params.pageSize = pageSize;

        // https://developer.helpscout.com/mailbox-api/endpoints/folders/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.helpscout.net/v2/mailboxes/${mailboxId}/folders`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data['_embedded']?.folders || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
