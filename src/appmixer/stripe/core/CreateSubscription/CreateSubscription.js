'use strict';

const lib = require('../../lib');

module.exports = {

    // https://docs.stripe.com/api/subscriptions/create
    async receive(context) {

        const {
            customer,
            items,
            trialPeriodDays,
            defaultPaymentMethod,
            collectionMethod,
            daysUntilDue,
            description,
            metadata
        } = context.messages.in.content;

        if (!customer) {
            throw new context.CancelError('Customer ID is required!');
        }

        const lineItems = lib.normalizeLineItems(context, items, 'Items');
        if (!lineItems.length) {
            throw new context.CancelError('At least one item with a recurring price ID is required!');
        }

        if (collectionMethod === 'send_invoice' && !lib.isSet(daysUntilDue)) {
            throw new context.CancelError('Days Until Due is required when the collection method is Send Invoice.');
        }

        const data = {
            customer,
            items: lineItems
        };
        if (lib.isSet(trialPeriodDays)) data.trial_period_days = trialPeriodDays;
        if (lib.isSet(defaultPaymentMethod)) data.default_payment_method = defaultPaymentMethod;
        if (lib.isSet(collectionMethod)) data.collection_method = collectionMethod;
        if (collectionMethod === 'send_invoice') data.days_until_due = daysUntilDue;
        if (lib.isSet(description)) data.description = description;

        const metadataObject = lib.kvToObject(context, metadata, 'Metadata');
        if (Object.keys(metadataObject).length) data.metadata = metadataObject;

        const subscription = await lib.stripeRequest(context, {
            method: 'POST',
            path: '/v1/subscriptions',
            data
        });

        return context.sendJson(subscription, 'out');
    }
};
