'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { asin, marketplace } = context.messages.in.content;

        if (!asin) {
            throw new context.CancelError('ASIN is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/api/v1/offers',
            params: {
                asin: asin,
                marketplace: marketplace || 'com'
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
