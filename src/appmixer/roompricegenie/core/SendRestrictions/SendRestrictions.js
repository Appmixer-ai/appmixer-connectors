'use strict';

const lib = require('../../lib');

// restrictions.update, partner to RoomPriceGenie
// (https://postman.roompricegenie.com/#3eb53b23-58bd-411f-a409-e3e843b2837a).
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        const data = lib.buildCalendarData(context, input, {
            label: 'Restriction Updates',
            withRatePlan: true,
            values: ({ minStayArrival, minStayThrough }) => {
                if (lib.isEmpty(minStayArrival) && lib.isEmpty(minStayThrough)) {
                    throw new context.CancelError('Fill in Minimum Stay (Arrival), Minimum Stay (Stay-Through) or '
                        + 'both (or use Restriction Updates (JSON)).');
                }
                const calendarValues = {};
                if (!lib.isEmpty(minStayThrough)) {
                    calendarValues.min_stay_through = lib.toInteger(context, minStayThrough, 'Minimum Stay (Stay-Through)');
                }
                if (!lib.isEmpty(minStayArrival)) {
                    calendarValues.min_stay_arrival = lib.toInteger(context, minStayArrival, 'Minimum Stay (Arrival)');
                }
                return { calendarValues };
            }
        });

        const result = await lib.sendEvent(context, { event: 'restrictions.update', data });
        return context.sendJson(result, 'out');
    }
};
