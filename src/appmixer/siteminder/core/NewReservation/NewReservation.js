'use strict';

const lib = require('../../lib');

// Reservations arrive through the plugin route (routes.js), which sets "eventType" with
// lib.classifyReservation(). This trigger passes on the new ones.
module.exports = {

    async start(context) {

        return lib.addReservationListener(context);
    },

    async stop(context) {

        return lib.removeReservationListener(context);
    },

    async receive(context) {

        return lib.receiveReservation(context, reservation => reservation.eventType === 'new');
    },

    // Flow Test Mode: SiteMinder has no API to read a reservation, so there is no real sample.
    async test(context) {

        throw new context.CancelError(lib.NO_TEST_SAMPLE);
    }
};
