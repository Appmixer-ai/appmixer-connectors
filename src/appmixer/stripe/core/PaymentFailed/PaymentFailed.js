'use strict';

const lib = require('../../lib');

// payment_intent.payment_failed carries a PaymentIntent, invoice.payment_failed an Invoice.
// https://docs.stripe.com/api/events/types
const EVENT_TYPES = ['payment_intent.payment_failed', 'invoice.payment_failed'];

function enabledEvents(context) {

    const { events } = context.properties;
    const selected = lib.isSet(events) && (!Array.isArray(events) || events.length)
        ? lib.normalizeMultiselectInput(events, context, 'Events')
        : EVENT_TYPES;
    const unsupported = selected.filter(type => !EVENT_TYPES.includes(type));
    if (unsupported.length) {
        throw new context.CancelError(`Unsupported events: ${unsupported.join(', ')}`);
    }
    return selected;
}

module.exports = {

    async start(context) {

        return lib.registerWebhook(context, enabledEvents(context));
    },

    async stop(context) {

        return lib.unregisterWebhook(context);
    },

    async receive(context) {

        if (context.messages.webhook) {
            return lib.receiveEvent(context, enabledEvents(context));
        }
    },

    async test(context) {

        // Throws a CancelError when Stripe has no recent event of these types.
        const event = await lib.latestEventOutput(context, enabledEvents(context));
        if (!event) {
            throw new context.CancelError('No recent event to use as test data.');
        }
        return context.sendJson(event, 'out');
    }
};
