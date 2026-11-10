'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { asin, marketplace, days } = context.messages.in.content;

        if (!asin) {
            throw new context.CancelError('ASIN is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/api/v1/history',
            params: {
                asin: asin,
                marketplace: marketplace || 'com',
                days: days
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
