'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { ip } = context.messages.in.content;

        if (!ip) {
            throw new context.CancelError('IP Address is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/intelligence/ip',
            params: {
                query: ip
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
