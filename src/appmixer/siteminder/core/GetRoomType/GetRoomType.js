'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { publisherCode, hotelCode, roomTypeCode } = context.messages.in.content;

        if (lib.isEmpty(publisherCode)) {
            throw new context.CancelError('Publisher is required!');
        }
        if (lib.isEmpty(hotelCode)) {
            throw new context.CancelError('Hotel is required!');
        }
        if (lib.isEmpty(roomTypeCode)) {
            throw new context.CancelError('Room Type is required!');
        }

        const item = await lib.fetchObject(context, {
            segments: [
                ...lib.hotelSegments(context, { publisherCode, hotelCode }),
                'roomTypes', lib.pathSegment(context, roomTypeCode, 'Room Type')
            ],
            label: 'the room type'
        });

        return context.sendJson(lib.withLocalizedName(item), 'out');
    }
};
