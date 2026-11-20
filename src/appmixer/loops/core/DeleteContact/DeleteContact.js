'use strict';

const lib = require('../../lib');

module.exports = {

    // https://loops.so/docs/api-reference/delete-contact
    async receive(context) {

        const { identifyBy = 'email', identifier } = context.messages.in.content;

        if (!identifier) {
            throw new context.CancelError('Email or User ID is required!');
        }
        if (identifyBy !== 'email' && identifyBy !== 'userId') {
            throw new context.CancelError('Identify Contact By must be "email" or "userId".');
        }

        await lib.request(context, {
            method: 'POST',
            path: '/v1/contacts/delete',
            data: { [identifyBy]: identifier }
        });

        return context.sendJson({}, 'out');
    }
};
