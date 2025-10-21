'use strict';
const ClickUpClient = require('../../ClickUpClient');

module.exports = {

    async receive(context) {

        const { taskId } = context.messages.in.content;
        if (!taskId) {
            throw new context.CancelError('Task ID is required');
        }


        const clickUpClient = new ClickUpClient(context);

        await clickUpClient.request('DELETE', `/task/${taskId}`);

        return context.sendJson({ taskId }, 'out');
    }
};
