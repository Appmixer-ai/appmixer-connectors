'use strict';
const lib = require('../../lib');
const gqlStore = require('../../gql-store');
const client = require('../../graphql-client');

const NAMES = ['available', 'on_hand'];

/**
 * Set the quantity of an inventory item at a location.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const inputs = context.messages.in.content;
        if (!inputs.inventoryItemId) {
            throw new context.CancelError('Inventory Item ID is required!');
        }
        const quantity = Number(inputs.quantity);
        if (inputs.quantity === undefined || inputs.quantity === null || inputs.quantity === '' || !Number.isInteger(quantity)) {
            throw new context.CancelError(`Quantity must be a whole number, got "${inputs.quantity}".`);
        }
        const name = inputs.quantityName || 'available';
        if (!NAMES.includes(name)) {
            throw new context.CancelError(`Unsupported quantity "${inputs.quantityName}".`);
        }

        const params = {
            item: inputs.inventoryItemId,
            locationId: inputs.locationId || undefined,
            quantity,
            name,
            reason: inputs.reason || 'correction'
        };
        params.idempotencyKey = client.idempotencyKey(context, params);

        let level;
        try {
            level = await gqlStore(lib.runner(context)).setInventoryQuantity(params);
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson(level, 'out');
    }
};
