
'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'name':{ 'type':'string','title':'Name' } };

module.exports = {
    async receive(context) {

        const { team_id, query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'projects', value: 'projects' });
        }

        // https://www.figma.com/developers/api#projects-get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.figma.com/v1/teams/{team_id}/projects',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
