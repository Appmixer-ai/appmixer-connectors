'use strict';
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            // TODO
        }

        const body = context.messages.task.content;

        if (body.decisionBy) {
            body.decisionBy = new Date(body.decisionBy).toISOString();
        }

        const task = await context.callAppmixer({
            endPoint: '/plugins/appmixer/slack/tasks',
            method: 'POST',
            body
        });
        context.log({ step: 'createTask', task });

        const webhook = await context.callAppmixer({
            endPoint: '/plugins/appmixer/slack/tasks/webhooks',
            method: 'POST',
            body: { url: context.getWebhookUrl(), taskId: task.taskId }
        });
        context.log({ step: 'createWebhook', webhook });

        // Send Slack message to the channel when task is created
        const { channel, title, description, requester, approver, decisionBy } = body;

        const blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: `*${title}*\n${description}` } },
            { type: 'context', elements: [
                { type: 'mrkdwn', text: `*Requester:* <@${requester}>   *Approver:* <@${approver}>` },
                { type: 'mrkdwn', text: `*Decision by:* ${decisionBy}` }
            ] },
            { type: 'actions', elements: [
                { type: 'button', text: { type: 'plain_text', text: 'Approve' }, style: 'primary', value: task.taskId, action_id: 'approve_task' },
                { type: 'button', text: { type: 'plain_text', text: 'Reject' }, style: 'danger', value: task.taskId, action_id: 'reject_task' }
            ] }
        ];
        context.log({ step: 'blocks', blocks });

        await lib.sendMessage(context, {
            channelId: channel,
            text: `${title}\n${description}`,
            blocks,
            asBot: true
        });

        await context.sendJson(task, 'created');
        context.log({ step: 'sendJson', task, taskId: task.id });

        await context.stateSet(webhook.webhookId, {});
        context.log({ step: 'stateSet', webhookId: webhook.webhookId, state: {} });
    },

    async stop(context) {

        const state = await context.loadState();

        return Promise.all(Object.keys(state).map(webhookId => {
            return context.callAppmixer({
                endPoint: `/plugins/appmixer/slack/tasks/webhooks/${webhookId}`,
                method: 'DELETE' });
        }));
    }
};
