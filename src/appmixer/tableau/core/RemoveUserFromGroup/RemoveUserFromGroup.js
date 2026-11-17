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

        await lib.apiRequest(context, {
            method: 'DELETE',
            path: '/groups/' + lib.encodeId(groupId) + '/users/' + lib.encodeId(userId)
        });

        return context.sendJson({}, 'out');
    }
};
