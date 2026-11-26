'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { bookingUid, cancellationReason } = context.messages.in.content;

        if (!bookingUid) {
            throw new context.CancelError('Booking UID is required!');
        }

        const data = {};
        if (cancellationReason) {
            data.cancellationReason = cancellationReason;
        }

        const body = await lib.request(context, {
            method: 'POST',
            path: '/v2/bookings/' + encodeURIComponent(bookingUid) + '/cancel',
            version: lib.API_VERSIONS.bookings,
            data
        });

        return context.sendJson(lib.firstBooking(body.data), 'out');
    }
};
