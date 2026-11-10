'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { email } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/intelligence/email',
            params: {
                query: email
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
