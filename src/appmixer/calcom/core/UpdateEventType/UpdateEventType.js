'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        if (!input.eventTypeId) {
            throw new context.CancelError('Event Type is required!');
        }
        const eventTypeId = lib.toInteger(context, input.eventTypeId, 'Event Type');

        const data = lib.eventTypeData(context, input);
        if (Object.keys(data).length === 0) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await lib.request(context, {
            method: 'PATCH',
            path: '/v2/event-types/' + eventTypeId,
            version: lib.API_VERSIONS.eventTypes,
            data
        });

        return context.sendJson({}, 'out');
    }
};
