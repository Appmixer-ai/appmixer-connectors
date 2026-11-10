'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { iban } = context.messages.in.content;

        if (!iban) {
            throw new context.CancelError('IBAN is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/vat/iban',
            params: {
                query: iban
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
