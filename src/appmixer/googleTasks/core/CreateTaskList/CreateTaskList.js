'use strict';

module.exports = {
    async receive(context) {

        const { title } = context.messages.in.content;

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/insert
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
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
