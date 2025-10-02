
'use strict';

const lib = require('../../lib');
module.exports = {
    async receive(context) {

        const { id, status, assignee_id, inbox_id, tag_ids } = context.messages.in.content;

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: '/conversations/{id}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
