'use strict';

module.exports = {
    async receive(context) {

        const { tasklist } = context.messages.in.content;

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasks/list

        try {
            const { data } = await context.httpRequest({
                method: 'GET',
                url: `https://tasks.googleapis.com/tasks/v1/lists/${tasklist}/tasks`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`
                }
            });
            return context.sendJson(data.items || [], 'out');
        } catch (error) {
            // Silence 400-level errors (like 400 Bad Request when tasklist is not available)
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                return context.sendJson([], 'out');
            }
            // Re-throw other errors
            throw error;
        }
    },

    tasksToSelectArray(tasks) {
        if (!Array.isArray(tasks)) return [];
        return tasks.map(task => ({
            label: task.title || 'Unnamed Task',
            value: task.id || ''
        }));
    }
};
