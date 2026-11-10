'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { vatNumber } = context.messages.in.content;

        if (!vatNumber) {
            throw new context.CancelError('VAT Number is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/vat',
            params: {
                query: vatNumber
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
