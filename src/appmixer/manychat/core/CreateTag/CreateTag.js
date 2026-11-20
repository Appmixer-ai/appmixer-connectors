'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const data = await lib.request(context, {
            method: 'POST',
            path: '/fb/page/createTag',
            data: { name }
        });

        return context.sendJson(data.tag, 'out');
    }
};
