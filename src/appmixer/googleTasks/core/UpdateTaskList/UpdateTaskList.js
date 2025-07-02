'use strict';

module.exports = {
    async receive(context) {

        const { tasklist, title } = context.messages.in.content;

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/patch
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://tasks.googleapis.com/tasks/v1/users/@me/lists/${tasklist}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                title
            }
        });

        return context.sendJson(data, 'out');
    }
};
