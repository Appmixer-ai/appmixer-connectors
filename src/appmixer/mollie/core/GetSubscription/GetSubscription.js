'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { customerId, subscriptionId } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        if (!subscriptionId) {
            throw new context.CancelError('Subscription Id is required!');
        }

        // https://docs.mollie.com/reference/v2/subscriptions-api/get-subscription
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
