'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            phoneNumberId,
            to,
            templateName,
            languageCode,
            components,
            contextMessageId
        } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }
        if (!to) {
            throw new context.CancelError('Recipient phone number is required!');
        }
        if (!templateName) {
            throw new context.CancelError('Template name is required!');
        }
        if (!languageCode) {
            throw new context.CancelError('Language code is required!');
        }

        let parsedComponents;
        if (components) {
            try {
                parsedComponents = typeof components === 'object' ? components : JSON.parse(components);
            } catch (e) {
                throw new context.CancelError('Template Components must be a valid JSON array.');
            }
            if (!Array.isArray(parsedComponents)) {
                throw new context.CancelError('Template Components must be a JSON array.');
            }
        }

        const template = {
            name: templateName,
            language: { code: languageCode }
        };
        if (parsedComponents) {
            template.components = parsedComponents;
        }

        const payload = {
            to: lib.sanitizePhoneNumber(to),
            type: 'template',
            template
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
