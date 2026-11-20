'use strict';

const lib = require('../../lib');

// Stripe sends payment_intent.succeeded (PaymentIntent object) or charge.succeeded (Charge object).
// https://docs.stripe.com/api/events/types
const EVENT_TYPES = ['payment_intent.succeeded', 'charge.succeeded'];

function enabledEvents(context) {

    const { eventType } = context.properties;
    if (eventType && !EVENT_TYPES.includes(eventType)) {
        throw new context.CancelError(`Unsupported event: ${eventType}`);
    }
    return [eventType || 'payment_intent.succeeded'];
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
