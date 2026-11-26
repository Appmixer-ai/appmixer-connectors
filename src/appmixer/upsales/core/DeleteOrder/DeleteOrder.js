'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { orderId } = context.messages.in.content;

        if (!orderId) {
            throw new context.CancelError('Order ID is required!');
        }

        // https://api.upsales.com/ - Opportunity / Order: DELETE /orders/{id}
        await lib.request(context, { method: 'DELETE', path: '/orders/' + encodeURIComponent(orderId) });
        return context.sendJson({}, 'out');
    }
};
