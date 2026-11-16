'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { bookingUid, name, email, timeZone, phoneNumber, language } = context.messages.in.content;

        if (!bookingUid) {
            throw new context.CancelError('Booking UID is required!');
        }
        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!email) {
            throw new context.CancelError('Email is required!');
        }
        if (!timeZone) {
            throw new context.CancelError('Time Zone is required!');
        }

        const data = { name, email, timeZone };
        if (phoneNumber) {
            data.phoneNumber = phoneNumber;
        }
        if (language) {
            data.language = language;
        }

        const body = await lib.request(context, {
            method: 'POST',
            path: '/v2/bookings/' + encodeURIComponent(bookingUid) + '/attendees',
            version: lib.API_VERSIONS.attendees,
            data
        });

        return context.sendJson(body.data, 'out');
    }
};
