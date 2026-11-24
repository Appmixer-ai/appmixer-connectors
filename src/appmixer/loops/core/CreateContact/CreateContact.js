'use strict';

const lib = require('../../lib');

module.exports = {

    // https://loops.so/docs/api-reference/create-contact
    async receive(context) {

        const {
            email,
            firstName,
            lastName,
            userId,
            userGroup,
            source,
            subscribed,
            mailingLists,
            customProperties
        } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const data = {
            ...lib.parseJsonInput(context, customProperties, 'Custom Properties', { object: true }),
            ...lib.compact({ email, firstName, lastName, userId, userGroup, source }),
            mailingLists: lib.mailingListsInput(context, mailingLists)
        };
        if (typeof subscribed === 'boolean') {
            data.subscribed = subscribed;
        }
        if (!data.mailingLists) {
            delete data.mailingLists;
        }

        const { data: response } = await lib.request(context, {
            method: 'POST',
            path: '/v1/contacts/create',
            data
        });

        return context.sendJson({ id: response.id, email }, 'out');
    }
};
