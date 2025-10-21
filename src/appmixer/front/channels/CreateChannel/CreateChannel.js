'use strict';

module.exports = {
    async receive(context) {

        const { inboxId, name, undoSendTime, allTeammatesCanReply, webhookUrl } = context.messages.in.content;

        if (!inboxId) {
            throw new context.CancelError('Inbox ID is required.');
        }

        if (!name) {
            throw new context.CancelError('Channel name is required.');
        }

        const requestData = { type: 'custom' };

        // Build settings object with the new properties
        const channelSettings = {};

        if (undoSendTime !== undefined) {
            channelSettings.undo_send_time = parseInt(undoSendTime, 10);
        }

        if (allTeammatesCanReply !== undefined) {
            channelSettings.all_teammates_can_reply = allTeammatesCanReply;
        }

        if (webhookUrl) {
            channelSettings.webhook_url = webhookUrl;
        }

        // Add settings to request data if we have any
        if (Object.keys(channelSettings).length > 0) {
            requestData.settings = channelSettings;
        }

        // https://dev.frontapp.com/reference/create-a-channel
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/inboxes/${inboxId}/channels`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
