'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { orderId } = context.messages.in.content;

        if (!orderId) {
            throw new context.CancelError('Order Id is required!');
        }

        // https://docs.mollie.com/reference/v2/orders-api/get-order
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/orders/${orderId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
