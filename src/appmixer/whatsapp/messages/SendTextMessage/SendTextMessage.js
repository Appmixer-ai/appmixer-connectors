'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { phoneNumberId, to, text, previewUrl, contextMessageId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }
        if (!to) {
            throw new context.CancelError('Recipient phone number is required!');
        }
        if (!text) {
            throw new context.CancelError('Message text is required!');
        }

        const payload = {
            to: lib.sanitizePhoneNumber(to),
            type: 'text',
            text: {
                body: text,
                preview_url: !!previewUrl
            }
        };

        if (contextMessageId) {
            payload.context = { message_id: contextMessageId };
        }

        const data = await lib.sendMessage(context, phoneNumberId, payload);

        const contact = (data.contacts && data.contacts[0]) || {};
        const message = (data.messages && data.messages[0]) || {};

        return context.sendJson({
            messageId: message.id,
            contactWaId: contact.wa_id,
            input: contact.input
        }, 'out');
    }
};
