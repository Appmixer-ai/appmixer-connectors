'use strict';

module.exports = {

    async start(context) {

        const userId = context.profileInfo.userId;
        const { channelAccessToken, channelSecret } = context.auth;

        return context.addListener(`line-message-${userId}`, { userId, channelAccessToken, channelSecret });
    },

    async stop(context) {
        const userId = context.profileInfo.userId;

        return context.removeListener(`line-message-${userId}`);
    },

    async receive(context) {

        if (context.messages.webhook) {
            await context.sendJson(context.messages.webhook.content.data, 'out');
        }
    }
};
