'use strict';
const lib = require('../../lib');
const gqlOrders = require('../../gql-orders');

/**
 * Update the tracking information of a fulfillment.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const inputs = context.messages.in.content;
        if (!inputs.fulfillmentId) {
            throw new context.CancelError('Fulfillment ID is required!');
        }
        const info = gqlOrders.trackingInfo(inputs);
        if (!info) {
            throw new context.CancelError('Enter a tracking number, a tracking URL or a carrier.');
        }

        try {
            await gqlOrders(lib.runner(context)).updateFulfillmentTracking({
                fulfillmentId: inputs.fulfillmentId,
                trackingInfo: info,
                notifyCustomer: inputs.notifyCustomer === true || inputs.notifyCustomer === 'true'
            });
        } catch (err) {
            throw lib.asCancel(context, err);
        }
        return context.sendJson({}, 'out');
    }
};
