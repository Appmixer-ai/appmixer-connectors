
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'title':{ 'type':'string','title':'Title' } };

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Task Lists', value: 'items' });
        }

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        if (outputType === 'object') {
            // One by one
            const items = data.items || [];
            for (let index = 0; index < items.length; index++) {
                context.sendJson(
                    { ...items[index], index, count: items.length },
                    'out'
                );
            }
        } else {
            // Array output (default)
            return context.sendJson(data.items || [], 'out');
        }
    }
};
