'use strict';

const lib = require('../lib');

// The output contract of one reservation. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../schema-reservation.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            profileIds, modifiedFrom, modifiedTo, reservationTypes, accountId, outputType
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Reservations' });
        }

        // The API takes the profiles as a repeated "profileIds[]" query parameter.
        const ids = lib.isEmpty(profileIds) || (Array.isArray(profileIds) && !profileIds.length)
            ? []
            : lib.normalizeMultiselectInput(profileIds, context, 'Profile IDs').map(id => lib.requireProfileId(context, id));

        // One request: GET /api/v2/reservations, the first page.
        const { data } = await lib.fetchPage(context, {
            path: '/api/v2/reservations',
            accountId,
            params: {
                'profileIds[]': ids.length ? ids : undefined,
                ...lib.modifiedRange(context, modifiedFrom, modifiedTo)
            },
            label: 'the list of reservations'
        });
        const records = lib.filterReservationTypes(context, lib.reservationsOf(data), reservationTypes);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
