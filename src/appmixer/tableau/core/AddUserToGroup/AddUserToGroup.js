'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { groupId, userId } = context.messages.in.content;

        if (!groupId) {
            throw new context.CancelError('Group ID is required!');
        }

        if (!userId) {
            throw new context.CancelError('User ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/groups/' + lib.encodeId(groupId) + '/users',
            data: { user: { id: userId } }
        });

        return context.sendJson(lib.mapUser(data.user), 'out');
    }
};
