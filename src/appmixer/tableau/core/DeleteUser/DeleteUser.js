'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { userId } = context.messages.in.content;

        if (!userId) {
            throw new context.CancelError('User ID is required!');
        }

        await lib.apiRequest(context, { method: 'DELETE', path: '/users/' + lib.encodeId(userId) });

        return context.sendJson({}, 'out');
    }
};
