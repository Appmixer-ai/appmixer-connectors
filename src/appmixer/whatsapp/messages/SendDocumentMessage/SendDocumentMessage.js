'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { to, mediaId, link, filename, caption, contextMessageId } = context.messages.in.content;

        if (!to) {
            throw new context.CancelError('Recipient phone number is required!');
        }
        if (!mediaId && !link) {
            throw new context.CancelError('Either Media ID or Document Link is required.');
        }
        if (mediaId && link) {
            throw new context.CancelError('Provide either Media ID or Document Link, not both.');
        }

        const document = mediaId ? { id: mediaId } : { link };
        if (filename) document.filename = filename;
        if (caption) document.caption = caption;

        const payload = {
            to: lib.sanitizePhoneNumber(to),
            type: 'document',
            document
        };

        if (contextMessageId) {
            payload.context = { message_id: contextMessageId };
        }

        const data = await lib.sendMessage(context, payload);

        const contact = (data.contacts && data.contacts[0]) || {};
        const message = (data.messages && data.messages[0]) || {};

        return context.sendJson({
            messageId: message.id,
            contactWaId: contact.wa_id,
            input: contact.input
        }, 'out');
    }
};
