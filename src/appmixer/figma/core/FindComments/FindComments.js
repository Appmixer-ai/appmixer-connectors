
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'message':{ 'type':'string','title':'Message' },'user':{ 'type':'object','properties':{ 'handle':{ 'type':'string','title':'User.Handle' } },'title':'User' } };

module.exports = {
    async receive(context) {

        const { file_id, query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'comments', value: 'comments' });
        }

        // https://www.figma.com/developers/api#comments-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.figma.com/v1/files/{file_id}/comments',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
