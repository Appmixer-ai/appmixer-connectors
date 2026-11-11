'use strict';

const lib = require('../../lib');

module.exports = {

    // https://loops.so/docs/api-reference/update-contact
    async receive(context) {

        const {
            email,
            userId,
            firstName,
            lastName,
            userGroup,
            source,
            subscribed,
            mailingLists,
            removeFromMailingLists,
            customProperties
        } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const data = {
            ...lib.parseJsonInput(context, customProperties, 'Custom Properties', { object: true }),
            ...lib.compact({ email, userId, firstName, lastName, userGroup, source })
        };
        // Loops recommends leaving `subscribed` out of updates unless the contact
        // should be explicitly unsubscribed or re-subscribed.
        if (subscribed === 'subscribe') {
            data.subscribed = true;
        } else if (subscribed === 'unsubscribe') {
            data.subscribed = false;
        }
        const lists = lib.mailingListsInput(context, mailingLists, removeFromMailingLists);
        if (lists) {
            data.mailingLists = lists;
        }

        await lib.request(context, {
            method: 'PUT',
            path: '/v1/contacts/update',
            data
        });

        return context.sendJson({}, 'out');
    }
};
