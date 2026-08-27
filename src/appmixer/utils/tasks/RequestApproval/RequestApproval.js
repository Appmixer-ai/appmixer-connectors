'use strict';
const Promise = require('bluebird');

module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            const webhookData = context.messages.webhook.content;
            const { data } = webhookData;

            data.id = data.taskId;
            delete data.taskId;

            if (data.status !== 'pending') {
                await context.sendJson(data, data.status);
            }
            return context.response({ status: 'success' }, 200, { 'Content-Type': 'application/json' });
        }

        const body = context.messages.task.content;

        if (body.decisionBy) {
            const decisionBy = new Date(body.decisionBy);
            if (decisionBy.getTime() <= Date.now()) {
                throw new context.CancelError('Decision by must be a future date.');
            }
            body.decisionBy = decisionBy.toISOString();
        }

        const task = await context.callAppmixer({
            endPoint: '/plugins/appmixer/utils/tasks/tasks',
            method: 'POST',
            body
        });

        task.id = task.taskId;
        delete task.taskId;

        await context.sendJson(task, 'created');
        const webhook = await context.callAppmixer({
            endPoint: '/plugins/appmixer/utils/tasks/webhooks',
            method: 'POST',
            body: { url: context.getWebhookUrl(), taskId: task.id }
        });

        await context.stateSet(webhook.webhookId, {});
    },

    async stop(context) {

        const state = await context.loadState();
        return Promise.map(Object.keys(state), webhookId => {
            return context.callAppmixer({
                endPoint: `/plugins/appmixer/utils/tasks/webhooks/${webhookId}`,
                method: 'DELETE'
            });
        });
    }
};
