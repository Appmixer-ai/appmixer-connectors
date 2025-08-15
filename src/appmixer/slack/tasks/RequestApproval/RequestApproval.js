'use strict';
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            // TODO: Implement webhook handler if/when plugin triggers webhooks directly into component.
        }

        const body = context.messages.task?.content || {};

        // Validate required inputs as per component.json schema
        const requiredFields = [
            ['title', 'Title'],
            ['description', 'Description'],
            ['requester', 'Requester'],
            ['approver', 'Approver'],
            ['decisionBy', 'Decision by'],
            ['channel', 'Channel']
        ];

        for (const [key, label] of requiredFields) {
            if (!body[key]) {
                throw new context.CancelError(`${label} is required!`);
            }
        }

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
        const {
            channel,
            title,
            description,
            requester,
            approver,
            decisionBy,
            username,
            iconUrl
        } = body;

        const blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: `*${title}*\n${description}` } },
            { type: 'context', elements: [
                { type: 'mrkdwn', text: `*Requester:* <@${requester}>   *Approver:* <@${approver}>` },
                { type: 'mrkdwn', text: `*Decision by:* ${decisionBy}` }
            ] },
            { type: 'actions', elements: [
                { type: 'button', text: { type: 'plain_text', text: 'Approve' }, style: 'primary', value: task.taskId, action_id: 'task_approve' },
                { type: 'button', text: { type: 'plain_text', text: 'Reject' }, style: 'danger', value: task.taskId, action_id: 'task_reject' }
            ] }
        ];
        context.log({ step: 'blocks', blocks });

        await lib.sendMessage(
            context,
            channel,
            `${title}\n${description || ''}`,
            true,
            undefined,
            undefined,
            {
                blocks,
                ...(username ? { username } : {}),
                ...(iconUrl ? { iconUrl } : {})
            }
        );

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
