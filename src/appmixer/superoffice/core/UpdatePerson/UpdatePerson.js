'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const { personId } = input;

        if (!personId) {
            throw new context.CancelError('Person ID is required!');
        }

        await lib.updateItem(context, 'person', personId, input);
        return context.sendJson({}, 'out');
    }
};
