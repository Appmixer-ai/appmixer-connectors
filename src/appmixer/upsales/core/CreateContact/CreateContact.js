'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
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

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
        }
        if (!firstName) {
            throw new context.CancelError('First Name is required!');
        }
        if (!lastName) {
            throw new context.CancelError('Last Name is required!');
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

        // https://api.upsales.com/ - Contacts: POST /contacts?usingFirstnameLastname=true
        const { data } = await lib.request(context, {
            method: 'POST',
            path: '/contacts',
            query: { usingFirstnameLastname: true },
            data: body
        });
        return context.sendJson(data.data, 'out');
    }
};
