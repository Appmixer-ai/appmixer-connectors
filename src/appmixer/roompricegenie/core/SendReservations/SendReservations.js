'use strict';

const lib = require('../../lib');

const REQUIRED = ['reservation_id', 'status', 'arrival_date', 'departure_date', 'created_at', 'updated_at'];

// reservation.update (https://postman.roompricegenie.com/#dde4483d-1511-48ec-8885-f8fc9f1f8057).
// Used by RoomPriceGenie for reporting. At most 200 reservations per message.
module.exports = {

    async receive(context) {

        const { reservations, partnerPropertyCode, propertyCode } = context.messages.in.content;

        const data = lib.parseJsonArray(context, reservations, 'Reservations');
        if (!data || !data.length) {
            throw new context.CancelError('Reservations is required: a JSON array of reservations.');
        }
        if (data.length > lib.MAX_RESERVATIONS) {
            throw new context.CancelError(`RoomPriceGenie accepts at most ${lib.MAX_RESERVATIONS} reservations in one `
                + `message, got ${data.length}. Split them into several messages.`);
        }
        data.forEach((reservation, index) => {
            const missing = REQUIRED.filter(field => lib.isEmpty(reservation[field]));
            if (missing.length) {
                throw new context.CancelError(`Reservations: item ${index + 1} is missing ${missing.join(', ')}.`);
            }
            if (!Array.isArray(reservation.stay_dates)) {
                throw new context.CancelError(`Reservations: item ${index + 1} needs stay_dates (an array).`);
            }
        });

        const accountCode = lib.account(context).propertyCode;
        const result = await lib.sendEvent(context, {
            event: 'reservation.update',
            propertyCode,
            extra: {
                partner_property_code: lib.isEmpty(partnerPropertyCode)
                    ? accountCode
                    : String(partnerPropertyCode).trim()
            },
            data
        });
        return context.sendJson(result, 'out');
    }
};
