'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { bookingUid } = context.messages.in.content;

        if (!bookingUid) {
            throw new context.CancelError('Booking UID is required!');
        }

        const booking = await lib.getBooking(context, bookingUid);
        return context.sendJson(booking, 'out');
    }
};
