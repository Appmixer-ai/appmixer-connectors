'use strict';

const lib = require('../../lib');

const FIELDS = ['email', 'firstName', 'lastName', 'company', 'jobTitle', 'phone', 'country', 'state', 'streetAddress', 'city', 'postalCode'];

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.email) {
            throw new context.CancelError('Email is required!');
        }

        const contact = await lib.request(context, {
            method: 'POST',
            path: '/public/v1/contacts',
            data: lib.contactData(input, FIELDS)
        });

        return context.sendJson(contact, 'out');
    }
};
