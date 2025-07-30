
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'email':{ 'type':'string','title':'Email' },'name':{ 'type':'string','title':'Name' } };

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://developers.mailerlite.com/docs/#subscribers
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/subscribers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
