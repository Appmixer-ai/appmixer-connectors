'use strict';
const lib = require('../../lib');
const gqlOrders = require('../../gql-orders');

const REASONS = ['CUSTOMER', 'DECLINED', 'FRAUD', 'INVENTORY', 'STAFF', 'OTHER'];

function toBoolean(value) {

    return value === true || value === 'true';
}

/**
 * Cancel an order.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const inputs = context.messages.in.content;
        if (!inputs.id) {
            throw new context.CancelError('Order ID is required!');
        }
        const reason = inputs.reason ? String(inputs.reason).trim().toUpperCase() : 'OTHER';
        if (!REASONS.includes(reason)) {
            throw new context.CancelError(`Unsupported cancellation reason "${inputs.reason}".`);
        }

        try {
            await gqlOrders(lib.runner(context)).cancel({
                id: inputs.id,
                reason,
                restock: toBoolean(inputs.restock),
                refund: toBoolean(inputs.refund),
                notifyCustomer: toBoolean(inputs.notifyCustomer),
                staffNote: inputs.staffNote
            });
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson({}, 'out');
    }
};
