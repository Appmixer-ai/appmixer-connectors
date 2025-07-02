'use strict';

module.exports = {
    async receive(context) {

        const { tasklist, task } = context.messages.in.content;

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasks/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://tasks.googleapis.com/tasks/v1/lists/${tasklist}/tasks/${task}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
