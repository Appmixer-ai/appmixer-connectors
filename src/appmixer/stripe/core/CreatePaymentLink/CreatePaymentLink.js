'use strict';

const lib = require('../../lib');

module.exports = {

    // https://docs.stripe.com/api/payment-link/create
    async receive(context) {

        const { lineItems, redirectUrl, metadata } = context.messages.in.content;

        const items = lib.normalizeLineItems(context, lineItems);
        if (!items.length) {
            throw new context.CancelError('At least one line item with a price ID is required!');
        }

        const data = { line_items: items };
        if (lib.isSet(redirectUrl)) {
            data.after_completion = { type: 'redirect', redirect: { url: redirectUrl } };
        }

        const metadataObject = lib.kvToObject(context, metadata, 'Metadata');
        if (Object.keys(metadataObject).length) data.metadata = metadataObject;

        const paymentLink = await lib.stripeRequest(context, {
            method: 'POST',
            path: '/v1/payment_links',
            data
        });

        return context.sendJson(paymentLink, 'out');
    }
};
