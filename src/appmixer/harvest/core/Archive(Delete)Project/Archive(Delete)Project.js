
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { project_id } = context.messages.in.content;

        // https://help.getharvest.com/api-v2/projects-api/projects/projects/
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: '/projects/{project_id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
