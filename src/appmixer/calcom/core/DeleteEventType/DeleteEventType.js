'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { eventTypeId } = context.messages.in.content;

        if (!eventTypeId) {
            throw new context.CancelError('Event Type is required!');
        }

        await lib.request(context, {
            method: 'DELETE',
            path: '/v2/event-types/' + lib.toInteger(context, eventTypeId, 'Event Type'),
            version: lib.API_VERSIONS.eventTypes
        });

        return context.sendJson({}, 'out');
    }
};
