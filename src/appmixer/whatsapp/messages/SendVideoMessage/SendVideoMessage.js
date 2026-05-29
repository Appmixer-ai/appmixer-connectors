'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { phoneNumberId, to, mediaId, link, caption, contextMessageId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }
        if (!to) {
            throw new context.CancelError('Recipient phone number is required!');
        }
        if (!mediaId && !link) {
            throw new context.CancelError('Either Media ID or Video Link is required.');
        }
        if (mediaId && link) {
            throw new context.CancelError('Provide either Media ID or Video Link, not both.');
        }

        const video = mediaId ? { id: mediaId } : { link };
        if (caption) video.caption = caption;

        const payload = {
            to: lib.sanitizePhoneNumber(to),
            type: 'video',
            video
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
