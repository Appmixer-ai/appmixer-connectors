'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { userId } = context.messages.in.content;
        if (!userId) {
            throw new context.CancelError('User ID is required!');
        }

        const { data } = await lib.apiRequest(context, { path: '/api/v1/users/' + encodeURIComponent(userId) });
        return context.sendJson(lib.mapUser(data), 'out');
    }
};
