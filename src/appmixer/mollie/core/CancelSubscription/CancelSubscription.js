'use strict';

module.exports = {
    async receive(context) {

        const { customerId, subscriptionId, testmode } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        if (!subscriptionId) {
            throw new context.CancelError('Subscription Id is required!');
        }

        const params = testmode ? { testmode: true } : {};

        // https://docs.mollie.com/reference/v2/subscriptions-api/cancel-subscription
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.mollie.com/v2/customers/${customerId}/subscriptions/${subscriptionId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            params
        });

        return context.sendJson({}, 'out');
    }
};
