'use strict';
const lib = require('../../lib');
const gqlStore = require('../../gql-store');

/**
 * Delete a draft order.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;
        if (!id) {
            throw new context.CancelError('Draft Order ID is required!');
        }

        try {
            await gqlStore(lib.runner(context)).deleteDraftOrder(id);
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson({}, 'out');
    }
};
