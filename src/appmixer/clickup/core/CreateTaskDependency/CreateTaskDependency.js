'use strict';
const ClickUpClient = require('../../ClickUpClient');

module.exports = {

    async receive(context) {

        const { taskId, dependsOnTaskId } = context.messages.in.content;
        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }
        if (!dependsOnTaskId) {
            throw new context.CancelError('Depends On Task ID is required!');
        }

        const clickUpClient = new ClickUpClient(context);

        const result = await clickUpClient.request('POST', `/task/${taskId}/dependency`, { data: { depends_on: dependsOnTaskId } });

        return context.sendJson(result, 'out');
    }
};
