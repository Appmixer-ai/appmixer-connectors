
'use strict';

const lib = require('../../lib');
const schema = { 'id':{ 'type':'string','title':'Id' },'object':{ 'type':'string','title':'Object' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://docs.x.ai/docs/models
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.x.ai/v1/https://api.x.ai/v1/models',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
