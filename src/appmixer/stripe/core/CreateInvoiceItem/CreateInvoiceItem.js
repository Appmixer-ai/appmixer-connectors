'use strict';

const lib = require('../../lib');

module.exports = {

    // https://docs.stripe.com/api/invoiceitems/create
    async receive(context) {

        const {
            customer,
            price,
            quantity,
            amount,
            currency,
            description,
            invoice,
            metadata
        } = context.messages.in.content;

        if (!customer) {
            throw new context.CancelError('Customer ID is required!');
        }

        const hasPrice = lib.isSet(price);
        const hasAmount = lib.isSet(amount);
        if (hasPrice && hasAmount) {
            throw new context.CancelError('Set either Price ID or Amount, not both.');
        }
        if (!hasPrice && !hasAmount) {
            throw new context.CancelError('Price ID or Amount is required!');
        }
        if (hasAmount && !lib.isSet(currency)) {
            throw new context.CancelError('Currency is required with Amount.');
        }

        const data = { customer };
        if (hasPrice) {
            data.pricing = { price };
            if (lib.isSet(quantity)) data.quantity = quantity;
        } else {
            data.amount = amount;
            data.currency = String(currency).toLowerCase();
        }
        if (lib.isSet(description)) data.description = description;
        if (lib.isSet(invoice)) data.invoice = invoice;

        const metadataObject = lib.kvToObject(context, metadata, 'Metadata');
        if (Object.keys(metadataObject).length) data.metadata = metadataObject;

        const invoiceItem = await lib.stripeRequest(context, {
            method: 'POST',
            path: '/v1/invoiceitems',
            data
        });

        return context.sendJson(invoiceItem, 'out');
    }
};
