'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { accountUserId } = context.messages.in.content;

        if (!accountUserId) {
            throw new context.CancelError('Account User is required!');
        }

        const id = lib.requireNumericId(context, accountUserId, 'Account User');

        await lib.request(context, { method: 'DELETE', path: `/account/user/${id}` });

        return context.sendJson({}, 'out');
    }
};
