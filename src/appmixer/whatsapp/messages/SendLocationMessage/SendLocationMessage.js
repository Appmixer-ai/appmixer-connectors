'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { phoneNumberId, to, latitude, longitude, name, address, contextMessageId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }
        if (!to) {
            throw new context.CancelError('Recipient phone number is required!');
        }
        if (latitude === undefined || latitude === null || latitude === '') {
            throw new context.CancelError('Latitude is required!');
        }
        if (longitude === undefined || longitude === null || longitude === '') {
            throw new context.CancelError('Longitude is required!');
        }

        const location = {
            latitude: Number(latitude),
            longitude: Number(longitude)
        };
        if (name) location.name = name;
        if (address) location.address = address;

        const payload = {
            to: lib.sanitizePhoneNumber(to),
            type: 'location',
            location
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
