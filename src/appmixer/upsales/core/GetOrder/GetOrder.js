'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { orderId } = context.messages.in.content;

        if (!orderId) {
            throw new context.CancelError('Order ID is required!');
        }

        // https://api.upsales.com/ - Opportunity / Order: GET /orders/{id}
        const { data } = await lib.request(context, { path: '/orders/' + encodeURIComponent(orderId) });
        return context.sendJson(data.data, 'out');
    }
};
