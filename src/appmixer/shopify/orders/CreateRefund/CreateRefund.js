'use strict';
const lib = require('../../lib');
const gqlOrders = require('../../gql-orders');
const client = require('../../graphql-client');

// Expression input ({ ADD: [...] }) or a plain array → rows that carry a line item.
function rows(value) {

    const list = Array.isArray(value) ? value : (value && Array.isArray(value.ADD) ? value.ADD : []);
    return list.filter(row => row && row.lineItemId !== undefined && row.lineItemId !== null && String(row.lineItemId).trim() !== '');
}

function toBoolean(value, fallback) {

    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return fallback;
}

/**
 * Create a refund of an order.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const inputs = context.messages.in.content;
        if (!inputs.orderId) {
            throw new context.CancelError('Order ID is required!');
        }

        const params = {
            orderId: inputs.orderId,
            lineItems: rows(inputs.lineItems),
            refundShipping: toBoolean(inputs.refundShipping, false),
            refundPayment: toBoolean(inputs.refundPayment, true),
            note: inputs.note,
            notify: toBoolean(inputs.notify, false)
        };
        params.idempotencyKey = client.idempotencyKey(context, params);

        let refund;
        try {
            refund = await gqlOrders(lib.runner(context)).createRefund(params);
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson(refund, 'out');
    }
};
