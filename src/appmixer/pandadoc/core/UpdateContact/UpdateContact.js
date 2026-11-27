'use strict';

const lib = require('../../lib');

// PATCH /public/v1/contacts/{id} does not accept email or country.
const FIELDS = ['firstName', 'lastName', 'company', 'jobTitle', 'phone', 'state', 'streetAddress', 'city', 'postalCode'];

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        await lib.request(context, {
            method: 'PATCH',
            path: '/public/v1/contacts/' + encodeURIComponent(input.contactId),
            data: lib.contactData(input, FIELDS)
        });

        return context.sendJson({}, 'out');
    }
};
