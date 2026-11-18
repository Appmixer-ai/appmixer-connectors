'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { timeEntryId } = context.messages.in.content;
        if (!timeEntryId) {
            throw new context.CancelError('Time Entry ID is required!');
        }
        const id = lib.requireId(context, timeEntryId, 'Time Entry ID');

        const { data } = await lib.request(context, {
            method: 'GET',
            url: `${lib.API_BASE_URL}/me/time_entries/${id}`
        });

        return context.sendJson(data, 'out');
    }
};
