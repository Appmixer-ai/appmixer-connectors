'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            chatId,
            text,
            parseMode,
            disableWebPagePreview,
            disableNotification,
            protectContent,
            messageThreadId,
            replyToMessageId,
            inlineKeyboard
        } = context.messages.in.content;

        if (!chatId) {
            throw new context.CancelError('Chat ID is required!');
        }

        if (!text) {
            throw new context.CancelError('Text is required!');
        }

        const keyboard = lib.buildInlineKeyboard(context, inlineKeyboard);

        const message = await lib.apiRequest(context, 'sendMessage', {
            chat_id: chatId,
            text,
            parse_mode: parseMode,
            link_preview_options: disableWebPagePreview ? { is_disabled: true } : undefined,
            disable_notification: disableNotification,
            protect_content: protectContent,
            message_thread_id: messageThreadId,
            reply_parameters: replyToMessageId ? { message_id: replyToMessageId } : undefined,
            reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
        });

        return await context.sendJson(message, 'out');
    }
};
