'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { groupId, name } = context.messages.in.content;

        if (!groupId) {
            throw new context.CancelError('Group ID is required!');
        }

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        await lib.apiRequest(context, {
            method: 'PUT',
            path: '/groups/' + lib.encodeId(groupId),
            data: { group: { name } }
        });

        return context.sendJson({}, 'out');
    }
};
