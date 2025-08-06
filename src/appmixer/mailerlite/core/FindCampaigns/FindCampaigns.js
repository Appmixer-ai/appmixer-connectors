'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Campaign Id' },'name':{ 'type':'string','title':'Campaign Name' },'type':{ 'type':'string','title':'Type' },'status':{ 'type':'string','title':'Status' } };

module.exports = {
    async receive(context) {

        const { status, outputType, limit } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Campaigns' });
        }

        const params = {};
        if (status) {
            params['filter[status]'] = status;
        }
        params.limit = Math.min(limit || 100, 100);

        // https://developers.mailerlite.com/docs/campaigns.html#campaign-list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://connect.mailerlite.com/api/campaigns',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            params: params
        });

        const records = data.data || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
