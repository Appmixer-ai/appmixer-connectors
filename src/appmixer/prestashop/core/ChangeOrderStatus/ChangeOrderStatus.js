/* eslint-disable camelcase */
'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { orderId, orderStateId, sendEmail } = context.messages.in.content;

        if (!orderId) {
            throw new context.CancelError('Order ID is required!');
        }
        if (!orderStateId) {
            throw new context.CancelError('Order Status is required!');
        }

        // A new order_histories record moves the order to the given state
        // (OrderHistory::addWs also updates the order's current_state).
        const xml = lib.buildResourceXml('order_history', {
            id_order: orderId,
            id_order_state: orderStateId
        });

        const params = sendEmail ? { sendemail: 1 } : {};

        const data = await lib.psRequest(context, {
            method: 'POST',
            path: '/order_histories',
            params,
            data: xml,
            headers: { 'Content-Type': 'text/xml' }
        });

        return context.sendJson(data.order_history || data, 'out');
    }
};
