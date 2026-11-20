'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { title, slug, lengthInMinutes, hidden, requiresConfirmation } = input;

        if (!title) {
            throw new context.CancelError('Title is required!');
        }
        if (!slug) {
            throw new context.CancelError('Slug is required!');
        }
        if (lengthInMinutes === undefined || lengthInMinutes === null || lengthInMinutes === '') {
            throw new context.CancelError('Length (Minutes) is required!');
        }

        const data = lib.eventTypeData(context, input);
        if (hidden) {
            data.hidden = true;
        }
        if (requiresConfirmation) {
            data.confirmationPolicy = { type: 'always', blockUnconfirmedBookingsInBooker: true };
        }

        const body = await lib.request(context, {
            method: 'POST',
            path: '/v2/event-types',
            version: lib.API_VERSIONS.eventTypes,
            data
        });

        return context.sendJson(body.data, 'out');
    }
};
