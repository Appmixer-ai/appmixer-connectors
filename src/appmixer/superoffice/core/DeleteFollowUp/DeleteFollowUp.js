'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { followUpId } = context.messages.in.content;

        if (!followUpId) {
            throw new context.CancelError('Follow-up ID is required!');
        }

        await lib.deleteItem(context, 'appointment', followUpId);
        return context.sendJson({}, 'out');
    }
};
