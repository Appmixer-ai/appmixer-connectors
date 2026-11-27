'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { userId, siteRole } = context.messages.in.content;

        if (!userId) {
            throw new context.CancelError('User ID is required!');
        }

        if (!siteRole) {
            throw new context.CancelError('Site Role is required!');
        }

        await lib.apiRequest(context, {
            method: 'PUT',
            path: '/users/' + lib.encodeId(userId),
            data: { user: { siteRole } }
        });

        return context.sendJson({}, 'out');
    }
};
