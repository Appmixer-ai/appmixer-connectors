
'use strict';

const lib = require('../../lib.generated');
const schema = { 'key':{ 'type':'string','title':'Key' },'name':{ 'type':'string','title':'Name' } };

module.exports = {
    async receive(context) {

        const { project_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'files', value: 'files' });
        }

        // https://www.figma.com/developers/api#project-files-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.figma.com/v1/projects/{project_id}/files',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
