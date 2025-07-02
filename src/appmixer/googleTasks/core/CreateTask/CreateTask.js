'use strict';

module.exports = {
    async receive(context) {

        const { tasklist, title, notes, due, status } = context.messages.in.content;

        if (!tasklist) {
            throw new context.CancelError('Tasklist ID is required');
        }

        if (!title) {
            throw new context.CancelError('Title is required');
        }

        // Build the task object
        const taskData = {
            title: title
        };

        if (notes) {
            taskData.notes = notes;
        }

        if (due) {
            taskData.due = due;
        }

        if (status) {
            taskData.status = status;
        }

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasks/insert
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://tasks.googleapis.com/tasks/v1/lists/${tasklist}/tasks`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: taskData
        });

        return context.sendJson(data, 'out');
    }
};
