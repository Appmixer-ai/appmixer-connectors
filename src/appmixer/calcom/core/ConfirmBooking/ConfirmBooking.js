'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { bookingUid } = context.messages.in.content;

        if (!bookingUid) {
            throw new context.CancelError('Booking UID is required!');
        }

        const body = await lib.request(context, {
            method: 'POST',
            path: '/v2/bookings/' + encodeURIComponent(bookingUid) + '/confirm',
            version: lib.API_VERSIONS.bookings
        });

        return context.sendJson(lib.firstBooking(body.data), 'out');
    }
};
