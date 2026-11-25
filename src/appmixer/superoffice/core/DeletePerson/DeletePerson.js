'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { personId } = context.messages.in.content;

        if (!personId) {
            throw new context.CancelError('Person ID is required!');
        }

        await lib.deleteItem(context, 'person', personId);
        return context.sendJson({}, 'out');
    }
};
