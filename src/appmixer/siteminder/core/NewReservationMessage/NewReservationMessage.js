'use strict';

const lib = require('../../lib');

// Reservations arrive through the plugin route (routes.js). This trigger passes on every message,
// or only those in the chosen statuses.
const wantedStatuses = (context) => {

    const value = context.properties.statuses;
    if (lib.isEmpty(value) || (Array.isArray(value) && !value.length)) {
        return [];
    }
    return lib.normalizeMultiselectInput(value, context, 'Statuses').map(status => String(status).toLowerCase());
};

module.exports = {

    async start(context) {

        // A wrong Statuses value fails the start of the flow, not every later message.
        wantedStatuses(context);
        return lib.addReservationListener(context);
    },

    async stop(context) {

        return lib.removeReservationListener(context);
    },

    async receive(context) {

        const statuses = wantedStatuses(context);
        return lib.receiveReservation(context, reservation => !statuses.length
            || statuses.includes(String(reservation.status || '').toLowerCase()));
    },

    // Flow Test Mode: SiteMinder has no API to read a reservation, so there is no real sample.
    async test(context) {

        throw new context.CancelError(lib.NO_TEST_SAMPLE);
    }
};
