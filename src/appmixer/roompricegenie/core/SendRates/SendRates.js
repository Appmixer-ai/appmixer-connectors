'use strict';

const lib = require('../../lib');

// rates.update, partner to RoomPriceGenie
// (https://postman.roompricegenie.com/#cb2a6b15-8ee3-4a40-ab5d-0b597f72d333).
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        const data = lib.buildCalendarData(context, input, {
            label: 'Rate Updates',
            withRatePlan: true,
            values: ({ price, occupancyPrices, defaultOccupancy }) => {
                const prices = lib.parseJsonArray(context, occupancyPrices, 'Occupancy Prices');
                if (lib.isEmpty(price) === !(prices && prices.length)) {
                    throw new context.CancelError('Fill in either Price or Occupancy Prices '
                        + '(or use Rate Updates (JSON)).');
                }
                const entryValues = {};
                if (!lib.isEmpty(defaultOccupancy)) {
                    entryValues.default_occupancy = lib.toInteger(context, defaultOccupancy, 'Default Occupancy');
                }
                if (!lib.isEmpty(price)) {
                    return { entryValues, calendarValues: { price: lib.toPrice(context, price, 'Price') } };
                }
                return {
                    entryValues,
                    calendarValues: {
                        prices: prices.map((item, index) => ({
                            occupancy: lib.toInteger(context, item.occupancy, `Occupancy Prices: item ${index + 1}: occupancy`),
                            price: lib.toPrice(context, item.price, `Occupancy Prices: item ${index + 1}: price`)
                        }))
                    }
                };
            }
        });

        const result = await lib.sendEvent(context, { event: 'rates.update', data });
        return context.sendJson(result, 'out');
    }
};
