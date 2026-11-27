'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { smartlockId, action, option } = context.messages.in.content;

        if (!smartlockId) {
            throw new context.CancelError('Smartlock is required!');
        }
        if (action === undefined || action === null || action === '') {
            throw new context.CancelError('Action is required!');
        }

        const id = lib.requireNumericId(context, smartlockId, 'Smartlock');
        const actionCode = lib.optionalInteger(context, action, 'Action');
        if (actionCode < 1 || actionCode > 7) {
            throw new context.CancelError('Action must be a number from 1 to 7.');
        }
        const optionMask = lib.optionalInteger(context, option, 'Option');

        return lib.sendDeviceAction(context, {
            smartlockId: id,
            path: '/action',
            data: lib.clean({ action: actionCode, option: optionMask || undefined })
        });
    }
};
