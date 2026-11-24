'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { firstName, lastName, email, phoneNumber } = context.messages.in.content;

        if (!firstName) {
            throw new context.CancelError('First Name is required!');
        }
        if (!lastName) {
            throw new context.CancelError('Last Name is required!');
        }
        if (!email && !phoneNumber) {
            throw new context.CancelError('Email or Phone Number is required!');
        }

        const data = { first_name: firstName, last_name: lastName };
        if (email) {
            data.email = email;
        }
        if (phoneNumber) {
            data.phone_number = phoneNumber;
        }

        const contact = await lib.request(context, { method: 'POST', path: '/contacts', data });
        return context.sendJson(contact, 'out');
    }
};
