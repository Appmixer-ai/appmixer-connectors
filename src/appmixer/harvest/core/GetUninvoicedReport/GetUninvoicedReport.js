
'use strict';

const lib = require('../../lib.generated');
const schema = { 'client_id':{ 'type':'number','title':'Client Id' },'client_name':{ 'type':'string','title':'Client Name' },'project_id':{ 'type':'number','title':'Project Id' },'project_name':{ 'type':'string','title':'Project Name' },'hours':{ 'type':'number','title':'Hours' },'amount':{ 'type':'number','title':'Amount' } };

module.exports = {
    async receive(context) {

        const { from, to, client_id, project_id, user_id, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Results' });
        }

        // https://help.getharvest.com/api-v2/reports-api/reports/uninvoiced/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/reports/uninvoiced',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
