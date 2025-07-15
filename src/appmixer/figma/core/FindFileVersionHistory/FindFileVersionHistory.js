
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'created_at':{ 'type':'string','title':'Created At' } };

module.exports = {
    async receive(context) {

        const { file_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'versions', value: 'versions' });
        }

        // https://www.figma.com/developers/api#file-versions-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.figma.com/v1/files/{file_id}/versions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
