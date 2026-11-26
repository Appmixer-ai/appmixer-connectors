'use strict';

const lib = require('../../lib');

// availability.update (https://postman.roompricegenie.com/#456819ff-20f2-4bb8-9b5c-d04600b4ca2b).
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        const data = lib.buildCalendarData(context, input, {
            label: 'Availability Updates',
            values: ({ roomsLeft, outOfOrder }) => {
                if (lib.isEmpty(roomsLeft)) {
                    throw new context.CancelError('Rooms Left is required (or fill in Availability Updates (JSON)).');
                }
                const calendarValues = { rooms_left: lib.toInteger(context, roomsLeft, 'Rooms Left') };
                if (!lib.isEmpty(outOfOrder)) {
                    calendarValues.out_of_order = lib.toInteger(context, outOfOrder, 'Out of Order');
                }
                return { calendarValues };
            }
        });

        const result = await lib.sendEvent(context, { event: 'availability.update', data });
        return context.sendJson(result, 'out');
    }
};
