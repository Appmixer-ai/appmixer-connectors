'use strict';

const lib = require('../../lib');

module.exports = {

    // https://loops.so/docs/api-reference/send-event
    async receive(context) {

        const {
            eventName,
            email,
            userId,
            eventProperties,
            contactProperties,
            mailingLists,
            idempotencyKey
        } = context.messages.in.content;

        if (!eventName) {
            throw new context.CancelError('Event Name is required!');
        }
        if (!email && !userId) {
            throw new context.CancelError('Email or User ID is required!');
        }

        const data = {
            // Contact properties go to the root of the request body.
            ...lib.parseJsonInput(context, contactProperties, 'Contact Properties', { object: true }),
            ...lib.compact({ email, userId, eventName })
        };
        const properties = lib.parseJsonInput(context, eventProperties, 'Event Properties', { object: true });
        if (properties) {
            data.eventProperties = properties;
        }
        const lists = lib.mailingListsInput(context, mailingLists);
        if (lists) {
            data.mailingLists = lists;
        }

        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
        const { data: response } = await lib.request(context, {
            method: 'POST',
            path: '/v1/events/send',
            data,
            headers
        });

        return context.sendJson({ success: response.success, eventName }, 'out');
    }
};
