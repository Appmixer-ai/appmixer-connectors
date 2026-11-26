'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { hotelId } = context.messages.in.content;

        if (!hotelId) {
            throw new context.CancelError('Hotel is required!');
        }

        const id = lib.requireNumericId(context, hotelId, 'Hotel');
        const hotel = await lib.fetchObject(context, { path: `/hotels/${id}`, label: 'the hotel' });

        // The representation has no ID of its own; it is the one that was asked for.
        return context.sendJson({ id: Number(id), ...lib.mapHotel(hotel) }, 'out');
    }
};
