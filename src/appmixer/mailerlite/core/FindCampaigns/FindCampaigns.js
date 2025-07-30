
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'name':{ 'type':'string','title':'Name' },'subject':{ 'type':'string','title':'Subject' },'status':{ 'type':'string','title':'Status' } };

module.exports = {
    async receive(context) {

        const { query, status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Data' });
        }

        // https://developers.mailerlite.com/docs/#campaigns-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/api/campaigns',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
