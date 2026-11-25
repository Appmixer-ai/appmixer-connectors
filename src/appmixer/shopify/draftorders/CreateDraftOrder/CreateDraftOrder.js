'use strict';
const lib = require('../../lib');
const gqlStore = require('../../gql-store');
const gqlOrders = require('../../gql-orders');

function rows(value) {

    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.ADD)) return value.ADD;
    return [];
}

/**
 * Create a draft order.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const inputs = context.messages.in.content;
        if (!rows(inputs.lineItems).length) {
            throw new context.CancelError('At least one line item is required!');
        }

        let draftOrder;
        try {
            const run = lib.runner(context);
            const currency = gqlStore.draftNeedsCurrency(inputs) ? await gqlOrders(run).shopCurrency() : undefined;
            draftOrder = await gqlStore(run).createDraftOrder(gqlStore.toDraftOrderInput(inputs, currency));
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson(draftOrder, 'out');
    }
};
