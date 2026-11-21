'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/groups',
            data: { group: { name } }
        });

        return context.sendJson(lib.mapGroup(data.group), 'out');
    }
};
