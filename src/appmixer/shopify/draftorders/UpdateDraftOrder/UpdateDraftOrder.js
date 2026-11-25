'use strict';
const lib = require('../../lib');
const gqlStore = require('../../gql-store');
const gqlOrders = require('../../gql-orders');

/**
 * Update a draft order. Fields left empty are not changed; line items, when
 * given, replace all line items of the draft order.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const inputs = context.messages.in.content;
        if (!inputs.id) {
            throw new context.CancelError('Draft Order ID is required!');
        }

        try {
            const run = lib.runner(context);
            const currency = gqlStore.draftNeedsCurrency(inputs) ? await gqlOrders(run).shopCurrency() : undefined;
            const input = gqlStore.toDraftOrderInput(inputs, currency);
            if (!Object.keys(input).length) {
                throw new context.CancelError('Enter at least one field to update.');
            }
            await gqlStore(run).updateDraftOrder(inputs.id, input);
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson({}, 'out');
    }
};
