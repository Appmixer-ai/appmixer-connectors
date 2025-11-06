
'use strict';

const lib = require('../../lib');
const schema = { 'b64_json':{ 'type':'string','title':'B64 Json' },'revised_prompt':{ 'type':'string','title':'Revised Prompt' } };

module.exports = {
    async receive(context) {

        const { model, prompt, n, size, response_format, user, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://docs.x.ai/docs/images
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.x.ai/v1/https://api.x.ai/v1/images/generations',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
