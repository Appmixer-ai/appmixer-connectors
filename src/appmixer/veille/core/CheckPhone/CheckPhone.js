'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { phone } = context.messages.in.content;

        if (!phone) {
            throw new context.CancelError('Phone Number is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/intelligence/phone',
            params: {
                query: phone
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
