'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'name':{ 'type':'string','title':'Name' },'type':{ 'type':'string','title':'Type' },'status':{ 'type':'string','title':'Status' } };

module.exports = {
    async receive(context) {

        const { status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Campaigns' });
        }

        const params = {};
        if (status) {
            params['filter[status]'] = status;
        }

        // https://developers.mailerlite.com/docs/#campaigns-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/campaigns',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: params
        });

        const records = data.data || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
