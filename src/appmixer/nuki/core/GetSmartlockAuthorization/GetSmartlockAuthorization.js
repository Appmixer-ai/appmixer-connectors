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

        const authorization = await lib.getAuthorization(context, id, authId);

        return context.sendJson(authorization, 'out');
    }
};
