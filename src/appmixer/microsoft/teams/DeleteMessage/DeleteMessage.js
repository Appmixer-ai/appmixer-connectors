'use strict';

const lib = require('../lib');
const { makeRequest } = require('../commons');

module.exports = {

    async receive(context) {

        const { location = 'channel', teamId, channelId, chatId, messageId, parentMessageId } =
            context.messages.in.content;

        const missing = lib.missingMessageInput({ location, teamId, channelId, chatId, messageId });
        if (missing) {
            throw new context.CancelError(missing);
        }

        let path = lib.messagePath({ location, teamId, channelId, chatId, messageId, parentMessageId });
        if (location === 'chat') {
            // Soft-deleting a chat message is only addressable under the user who sent it.
            const me = await lib.getMe(context);
            path = `/users/${encodeURIComponent(me.id)}${path}`;
        }

        await makeRequest(context, { method: 'POST', path: `${path}/softDelete` });

        return context.sendJson({}, 'out');
    }
};
