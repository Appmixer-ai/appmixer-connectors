'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { taskId } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required.');
        }

        const task = await lib.apiRequest(context, `/tasks/${taskId}`);

        return context.sendJson(task, 'out');
    }
};
