'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { timeEntryId } = context.messages.in.content;

        if (!timeEntryId) {
            throw new context.CancelError('Time Entry ID is required!');
        }

        const id = lib.requireId(context, timeEntryId, 'Time Entry ID');
        const { workspace } = await lib.urls(context);

        await lib.request(context, {
            method: 'DELETE',
            url: `${workspace}/time-entries/${id}`
        });

        return context.sendJson({}, 'out');
    }
};
