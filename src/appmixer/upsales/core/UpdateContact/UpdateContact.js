'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            contactId,
            companyId,
            firstName,
            lastName,
            email,
            phone,
            cellPhone,
            title,
            notes,
            customFields
        } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        const body = lib.compact({
            firstName,
            lastName,
            email,
            phone,
            cellPhone,
            title,
            notes,
            client: lib.ref(companyId),
            custom: lib.parseCustomFields(context, customFields)
        });

        // https://api.upsales.com/ - Contacts: PUT /contacts/{id}
        await lib.request(context, {
            method: 'PUT',
            path: '/contacts/' + encodeURIComponent(contactId),
            query: firstName || lastName ? { usingFirstnameLastname: true } : undefined,
            data: body
        });
        return context.sendJson({}, 'out');
    }
};
