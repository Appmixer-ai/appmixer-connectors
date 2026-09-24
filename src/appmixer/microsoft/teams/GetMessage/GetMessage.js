'use strict';

const lib = require('../lib');
const { makeRequest } = require('../commons');
const { chatMessage: ITEM_SCHEMA } = require('../schemas');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { location = 'channel', teamId, channelId, chatId, messageId, parentMessageId } =
            context.messages.in.content;

        const missing = lib.missingMessageInput({ location, teamId, channelId, chatId, messageId });
        if (missing) {
            throw new context.CancelError(missing);
        }

        const { data } = await makeRequest(context, {
            method: 'GET',
            path: lib.messagePath({ location, teamId, channelId, chatId, messageId, parentMessageId })
        });

        return context.sendJson(data, 'out');
    }
};
