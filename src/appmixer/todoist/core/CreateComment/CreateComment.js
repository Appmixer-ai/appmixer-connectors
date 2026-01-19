'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { content, taskId, projectId } = context.messages.in.content;

        if (!content) {
            throw new context.CancelError('Content is required!');
        }

        if (!taskId && !projectId) {
            throw new context.CancelError('Either Task ID or Project ID is required.');
        }

        const body = { content };

        if (taskId) {
            body.task_id = taskId;
        }

        if (projectId) {
            body.project_id = projectId;
        }

        const comment = await lib.apiRequest(context, '/comments', {
            method: 'POST',
            data: body
        });

        return context.sendJson(comment, 'out');
    }
};
