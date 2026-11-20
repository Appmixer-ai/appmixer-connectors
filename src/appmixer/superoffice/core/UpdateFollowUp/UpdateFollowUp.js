'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { followUpId } = input;

        if (!followUpId) {
            throw new context.CancelError('Follow-up ID is required!');
        }

        await lib.updateItem(context, 'appointment', followUpId, input);
        return context.sendJson({}, 'out');
    }
};
