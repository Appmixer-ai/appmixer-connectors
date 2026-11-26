'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { smartlockId, authorizationId } = context.messages.in.content;

        if (!smartlockId) {
            throw new context.CancelError('Smartlock is required!');
        }
        if (!authorizationId) {
            throw new context.CancelError('Authorization ID is required!');
        }

        const id = lib.requireNumericId(context, smartlockId, 'Smartlock');
        const authId = lib.requireHexId(context, authorizationId, 'Authorization ID');

        await lib.request(context, { method: 'DELETE', path: `/smartlock/${id}/auth/${authId}` });

        return context.sendJson({}, 'out');
    }
};
