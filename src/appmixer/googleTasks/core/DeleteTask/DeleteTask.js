'use strict';

module.exports = {
    async receive(context) {

        const { tasklist, task } = context.messages.in.content;

        if (!tasklist) {
            throw new context.CancelError('Tasklist ID is required');
        }

        if (!task) {
            throw new context.CancelError('Task ID is required');
        }

        // https://developers.google.com/workspace/tasks/reference/rest/v1/tasks/delete
        await context.httpRequest({
            method: 'DELETE',
            url: `https://tasks.googleapis.com/tasks/v1/lists/${tasklist}/tasks/${task}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({ success: true }, 'out');
    }
};
