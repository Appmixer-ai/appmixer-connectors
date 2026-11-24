'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { bookingUid, start, reschedulingReason, rescheduledBy } = context.messages.in.content;

        if (!bookingUid) {
            throw new context.CancelError('Booking UID is required!');
        }
        if (!start) {
            throw new context.CancelError('New Start is required!');
        }

        const data = { start: lib.toIsoDate(context, start, 'New Start') };
        if (reschedulingReason) {
            data.reschedulingReason = reschedulingReason;
        }
        if (rescheduledBy) {
            data.rescheduledBy = rescheduledBy;
        }

        const body = await lib.request(context, {
            method: 'POST',
            path: '/v2/bookings/' + encodeURIComponent(bookingUid) + '/reschedule',
            version: lib.API_VERSIONS.bookings,
            data
        });

        return context.sendJson(lib.firstBooking(body.data), 'out');
    }
};
