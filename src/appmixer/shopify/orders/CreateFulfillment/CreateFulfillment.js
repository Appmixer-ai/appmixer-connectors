'use strict';
const lib = require('../../lib');
const gqlOrders = require('../../gql-orders');

function present(value) {

    return value !== undefined && value !== null && String(value).trim() !== '';
}

// Expression input ({ ADD: [...] }) or a plain array → rows that carry a line item.
function rows(value) {

    const list = Array.isArray(value) ? value : (value && Array.isArray(value.ADD) ? value.ADD : []);
    return list.filter(row => row && present(row.lineItemId));
}

/**
 * Fulfill an order, or some of its line items.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const inputs = context.messages.in.content;
        if (!inputs.orderId) {
            throw new context.CancelError('Order ID is required!');
        }

        let fulfillment;
        try {
            fulfillment = await gqlOrders(lib.runner(context)).createFulfillment({
                orderId: inputs.orderId,
                lineItems: rows(inputs.lineItems),
                trackingInfo: gqlOrders.trackingInfo(inputs),
                notifyCustomer: inputs.notifyCustomer === true || inputs.notifyCustomer === 'true'
            });
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson(fulfillment, 'out');
    }
};
