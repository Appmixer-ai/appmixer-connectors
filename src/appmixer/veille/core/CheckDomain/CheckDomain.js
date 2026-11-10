'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { domain } = context.messages.in.content;

        if (!domain) {
            throw new context.CancelError('Domain is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/intelligence/domain',
            params: {
                query: domain
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
