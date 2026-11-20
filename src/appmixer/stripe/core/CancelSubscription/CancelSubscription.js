'use strict';

const lib = require('../../lib');

module.exports = {

    // https://docs.stripe.com/api/subscriptions/cancel
    async receive(context) {

        const { subscriptionId, invoiceNow, prorate, cancellationComment } = context.messages.in.content;

        if (!subscriptionId) {
            throw new context.CancelError('Subscription ID is required!');
        }

        const params = {};
        if (lib.isSet(invoiceNow)) params.invoice_now = lib.toBoolean(invoiceNow);
        if (lib.isSet(prorate)) params.prorate = lib.toBoolean(prorate);
        if (lib.isSet(cancellationComment)) params.cancellation_details = { comment: cancellationComment };

        const subscription = await lib.stripeRequest(context, {
            method: 'DELETE',
            path: `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
            params
        });

        return context.sendJson(subscription, 'out');
    }
};
