
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'number','title':'Id' },'name':{ 'type':'string','title':'Name' },'color':{ 'type':'string','title':'Color' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tags', value: 'tags' });
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/tags/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/tags',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        const records = data['_embedded']?.tags || [];

        if (context.properties.isSource) {
            return context.sendJson(records, 'out');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    },

    tagsToSelectArray(tags) {
        return tags.map(tag => ({
            label: tag.name,
            value: tag.id
        }));
    }
};
