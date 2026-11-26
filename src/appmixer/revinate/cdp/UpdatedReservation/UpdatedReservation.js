'use strict';

const lib = require('../lib');

const PATH = '/api/v2/reservations';
const LABEL = 'the list of reservations';

// The same reservation fires again when it is modified again, so the modification time is part of
// the key. The type is part of it because each reservation type has IDs of its own.
const reservationKey = (reservation) => {

    return `${reservation.reservation_type}:${reservation.reservation_id}@${reservation.revinate_last_modified_at}`;
};

module.exports = {

    // The CDP API has no webhooks, so the reservations are polled by their modification time.
    async tick(context) {

        // Skipped while the previous check is still running.
        return lib.runExclusive(context, async () => {

            const properties = context.properties || {};
            const { emit, state, truncated } = await lib.pollModified(context, {
                path: PATH,
                label: LABEL,
                extract: lib.reservationsOf,
                getKey: reservationKey,
                properties
            });

            // The API cannot filter by type, so every type is read and remembered and the unwanted
            // ones are dropped here.
            for (const reservation of lib.filterReservationTypes(context, emit, properties.reservationTypes)) {
                await context.sendJson(reservation, 'out');
            }

            if (truncated) {
                await context.log({
                    step: 'truncated',
                    message: 'More reservations were modified at once than one check reads. The rest was skipped.'
                });
            }

            if (state) {
                await context.saveState(state);
            }
        });
    },

    // Flow Test Mode: emit one existing reservation of a wanted type. Read-only, no state writes.
    async test(context) {

        const properties = context.properties || {};
        const { data } = await lib.fetchPage(context, { path: PATH, label: LABEL, accountId: properties.accountId });
        const reservations = lib.filterReservationTypes(context, lib.reservationsOf(data), properties.reservationTypes);

        if (!reservations.length) {
            throw new context.CancelError('No reservation matches the trigger settings yet. Widen the Reservation '
                + 'Types, or try again once Revinate has received a reservation.');
        }

        return context.sendJson(reservations[0], 'out');
    }
};
