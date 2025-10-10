'use strict';

module.exports = {
    async receive(context) {

        const {
            channelId, inboxId, name, undoSendTime, allTeammatesCanReply, webhookUrl
        } = context.messages.in.content;

        if (!channelId) {
            throw new context.CancelError('Channel ID is required.');
        }

        const requestData = {};

        // Add name if provided
        if (name) {
            requestData.name = name;
        }

        // Add inboxId if provided
        if (inboxId) {
            requestData.inboxId = inboxId;
        }

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

        // https://dev.frontapp.com/reference/update-channel
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/channels/${channelId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
