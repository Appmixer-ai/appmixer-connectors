'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { activityId } = context.messages.in.content;

        if (!activityId) {
            throw new context.CancelError('Task ID is required!');
        }

        // https://api.upsales.com/ - Tasks: DELETE /activities/{id}
        await lib.request(context, { method: 'DELETE', path: '/activities/' + encodeURIComponent(activityId) });
        return context.sendJson({}, 'out');
    }
};
