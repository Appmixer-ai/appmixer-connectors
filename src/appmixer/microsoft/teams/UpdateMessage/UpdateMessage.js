'use strict';

const lib = require('../lib');
const { makeRequest } = require('../commons');

module.exports = {

    async receive(context) {

        const {
            location = 'channel', teamId, channelId, chatId, messageId, parentMessageId, content, contentType = 'text'
        } = context.messages.in.content;

        const missing = lib.missingMessageInput({ location, teamId, channelId, chatId, messageId });
        if (missing) {
            throw new context.CancelError(missing);
        }
        if (!content) {
            throw new context.CancelError('Content is required!');
        }

        await makeRequest(context, {
            method: 'PATCH',
            path: lib.messagePath({ location, teamId, channelId, chatId, messageId, parentMessageId }),
            data: { body: { contentType, content } }
        });

        return context.sendJson({}, 'out');
    }
};
