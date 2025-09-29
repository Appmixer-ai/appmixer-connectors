
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'fieldType':{ 'type':'string','title':'Field Type' },'options':{ 'type':'array','items':{ 'type':'object','properties':{ 'id':{ 'type':'number','title':'Options.Id' },'label':{ 'type':'string','title':'Options.Label' } },'required':['id','label'] },'title':'Options' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Custom Fields', value: 'fields' });
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/custom-fields/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/conversation-fields',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const records = data['_embedded']?.fields || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
