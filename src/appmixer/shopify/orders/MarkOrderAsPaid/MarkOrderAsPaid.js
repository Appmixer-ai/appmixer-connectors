'use strict';
const lib = require('../../lib');
const gqlOrders = require('../../gql-orders');

/**
 * Mark an order as paid.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;
        if (!id) {
            throw new context.CancelError('Order ID is required!');
        }

        let order;
        try {
            order = await gqlOrders(lib.runner(context)).markAsPaid(id);
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson(order, 'out');
    }
};
