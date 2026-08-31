'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { chatId, messageId } = context.messages.in.content;

        if (!chatId) {
            throw new context.CancelError('Chat ID is required!');
        }

        if (!messageId) {
            throw new context.CancelError('Message ID is required!');
        }

        await lib.apiRequest(context, 'deleteMessage', {
            chat_id: chatId,
            message_id: messageId
        });

        return context.sendJson({}, 'out');
    }
};
