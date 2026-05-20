'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { phoneNumberId, to, mediaId, link, contextMessageId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }
        if (!to) {
            throw new context.CancelError('Recipient phone number is required!');
        }
        if (!mediaId && !link) {
            throw new context.CancelError('Either Media ID or Audio Link is required.');
        }
        if (mediaId && link) {
            throw new context.CancelError('Provide either Media ID or Audio Link, not both.');
        }

        const audio = mediaId ? { id: mediaId } : { link };

        const payload = {
            to: lib.sanitizePhoneNumber(to),
            type: 'audio',
            audio
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
