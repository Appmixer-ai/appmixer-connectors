'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { smartlockId } = context.messages.in.content;

        if (!smartlockId) {
            throw new context.CancelError('Smartlock is required!');
        }

        const id = lib.requireNumericId(context, smartlockId, 'Smartlock');
        const smartlock = await lib.getSmartlock(context, id);

        return context.sendJson(smartlock, 'out');
    }
};
