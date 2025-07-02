
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { tasklist } = context.messages.in.content;

        if (!tasklist) {
            throw new context.CancelError('Tasklist ID is required');
        }

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/delete
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${tasklist}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({ success: true }, 'out');
    }
};
