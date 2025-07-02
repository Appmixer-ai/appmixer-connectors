'use strict';

module.exports = {
    async receive(context) {

        const { tasklist, task, title, notes, due, status } = context.messages.in.content;
        // Build the update data object
        const updateData = {};

        if (title) {
            updateData.title = title;
        }

        if (notes !== undefined) {
            updateData.notes = notes;
        }

        if (due) {
            updateData.due = due;
        }

        if (status) {
            updateData.status = status;
        }

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasks/patch
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://tasks.googleapis.com/tasks/v1/lists/${tasklist}/tasks/${task}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: updateData
        });

        return context.sendJson(data, 'out');
    }
};
