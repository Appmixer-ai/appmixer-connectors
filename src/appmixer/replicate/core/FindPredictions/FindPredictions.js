
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'status':{ 'type':'string','title':'Status' },'output':{ 'type':'object','properties':{ 'result':{ 'type':'string','title':'Output.Result' } },'title':'Output' } };

module.exports = {
    async receive(context) {

        const { status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Results' });
        }

        // https://replicate.com/docs/reference/http#predictions
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.replicate.com/v1/predictions',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        const records = data.results || data || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
