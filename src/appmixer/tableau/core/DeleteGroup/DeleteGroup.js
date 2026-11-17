'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { groupId } = context.messages.in.content;

        if (!groupId) {
            throw new context.CancelError('Group ID is required!');
        }

        await lib.apiRequest(context, { method: 'DELETE', path: '/groups/' + lib.encodeId(groupId) });

        return context.sendJson({}, 'out');
    }
};
