'use strict';
const lib = require('../../lib');

module.exports = {

    async receive(context) {

        if (context.messages.webhook) {
            const webhookData = context.messages.webhook.content;
            const { data } = webhookData;

            // Normalize id
            if (data && data.taskId) {
                data.id = data.taskId;
                delete data.taskId;
            }

            // Emit event when status is resolved (not pending)
            if (data && data.status !== 'pending') {
                await context.sendJson(data, data.status);
            }

            return context.response({ status: 'success' }, 200, { 'Content-Type': 'application/json' });
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

        // Helper to validate and normalize a single Slack user reference.
        // Acceptable formats:
        //  - Raw user ID: U123ABCDEF (starts with U or W)
        // Reject anything containing spaces, commas
        function normalizeSlackUser(value, fieldLabel) {
            if (typeof value !== 'string' || !value.trim()) {
                throw new context.CancelError(`${fieldLabel} must be a Slack user ID.`);
            }
            // Raw ID format
            const idMatch = value.match(/^([UW][A-Z0-9]+)$/i);
            if (idMatch) {
                return idMatch[1];
            }
            throw new context.CancelError(`${fieldLabel} must be a valid Slack user ID (e.g. U123ABCDEF).`);
        }

        // Normalize and validate requester / approver (must be exactly one each)
        body.requester = normalizeSlackUser(body.requester, 'Requester');
        body.approver = normalizeSlackUser(body.approver, 'Approver');

        if (body.decisionBy) {
            const decisionDate = new Date(body.decisionBy);
            if (isNaN(decisionDate.getTime())) {
                throw new context.CancelError('Decision by date is invalid.');
            }
            if (decisionDate < new Date()) {
                throw new context.CancelError('Decision by date must be in the future.');
            }
        }

        if (body.requester === body.approver) {
            throw new context.CancelError('Requester and approver must be different users.');
        }

        const task = await context.callAppmixer({
            endPoint: '/plugins/appmixer/slack/tasks',
            method: 'POST',
            body
        });

        const webhook = await context.callAppmixer({
            endPoint: '/plugins/appmixer/slack/tasks/webhooks',
            method: 'POST',
            body: { url: context.getWebhookUrl(), taskId: task.taskId }
        });

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

        // Format decisionBy to YYYY-MM-DD HH:MM for human-readable display
        const decisionByReadable = decisionBy ? new Date(decisionBy).toLocaleString('sv-SE', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' }).replace('T', ' ') : 'N/A';

        const blocks = [
            { type: 'section', text: { type: 'mrkdwn', text: `*${title}*\n${description}` } },
            { type: 'context', elements: [
                { type: 'mrkdwn', text: `*Requester:* <@${requester}>   *Approver:* <@${approver}>` },
                { type: 'mrkdwn', text: `*Decision by:* ${decisionByReadable}` }
            ] },
            { type: 'actions', elements: [
                { type: 'button', text: { type: 'plain_text', text: 'Approve' }, style: 'primary', value: task.taskId, action_id: 'task_approve' },
                { type: 'button', text: { type: 'plain_text', text: 'Reject' }, style: 'danger', value: task.taskId, action_id: 'task_reject' }
            ] }
        ];

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

        await context.stateSet(webhook.webhookId, {});
    },

    async stop(context) {

        const state = await context.loadState();

        return Promise.all(Object.keys(state).map(webhookId => {

            return context.callAppmixer({
                endPoint: `/plugins/appmixer/slack/tasks/webhooks/${webhookId}`,
                method: 'DELETE'
            });
        }));
    }
};
