'use strict';

const lib = require('../../lib');

module.exports = {

    // https://docs.stripe.com/api/checkout/sessions/create
    async receive(context) {

        const {
            mode,
            lineItems,
            successUrl,
            cancelUrl,
            customer,
            customerEmail,
            currency,
            clientReferenceId,
            metadata
        } = context.messages.in.content;

        if (!mode) {
            throw new context.CancelError('Mode is required!');
        }
        if (!successUrl) {
            throw new context.CancelError('Success URL is required!');
        }
        if (lib.isSet(customer) && lib.isSet(customerEmail)) {
            throw new context.CancelError('Set either Customer ID or Customer Email, not both.');
        }

        const items = lib.normalizeLineItems(context, lineItems);
        if (mode !== 'setup' && !items.length) {
            throw new context.CancelError('At least one line item is required in payment and subscription mode.');
        }
        if (mode === 'setup' && !lib.isSet(currency)) {
            throw new context.CancelError('Currency is required in setup mode.');
        }

        const data = {
            mode,
            success_url: successUrl
        };
        if (mode !== 'setup') data.line_items = items;
        if (lib.isSet(cancelUrl)) data.cancel_url = cancelUrl;
        if (lib.isSet(customer)) data.customer = customer;
        if (lib.isSet(customerEmail)) data.customer_email = customerEmail;
        if (lib.isSet(currency)) data.currency = String(currency).toLowerCase();
        if (lib.isSet(clientReferenceId)) data.client_reference_id = clientReferenceId;

        const metadataObject = lib.kvToObject(context, metadata, 'Metadata');
        if (Object.keys(metadataObject).length) data.metadata = metadataObject;

        const session = await lib.stripeRequest(context, {
            method: 'POST',
            path: '/v1/checkout/sessions',
            data
        });

        return context.sendJson(session, 'out');
    }
};
