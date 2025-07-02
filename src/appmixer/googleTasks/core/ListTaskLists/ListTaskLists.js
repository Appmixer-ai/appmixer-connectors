'use strict';

module.exports = {
    async receive(context) {

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasklists/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });
        context.log({ step: 'ListTaskLists', data: data.items });
        return context.sendJson(data.items, 'out');
    },

    taskListsToSelectArray(taskLists) {
        if (!Array.isArray(taskLists)) return [];
        return taskLists.map(taskList => ({
            label: taskList.title || 'Unnamed Task List',
            value: taskList.id || ''
        }));
    }
};
