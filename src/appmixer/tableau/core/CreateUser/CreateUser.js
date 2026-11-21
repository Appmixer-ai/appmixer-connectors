'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, siteRole } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        if (!siteRole) {
            throw new context.CancelError('Site Role is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/users',
            data: { user: { name, siteRole } }
        });

        return context.sendJson(lib.mapUser(data.user), 'out');
    }
};
