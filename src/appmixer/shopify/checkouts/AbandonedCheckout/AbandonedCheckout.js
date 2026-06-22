'use strict';
const commons = require('../../shopify-commons');

/**
 * Component which triggers whenever a checkout (cart) is created and may be abandoned.
 * Shopify emits the `checkouts/create` webhook for checkouts that customers start but
 * do not necessarily complete, which is the basis for abandoned cart recovery.
 * @extends {Component}
 */
module.exports = {

    async start(context) {

        return commons.registerWebhook(context, 'checkouts/create');
    },

    async receive(context) {

        if (context.messages.webhook) {
            return commons.onReceive(context, 'checkout');
        }
    },

    async stop(context) {

        return commons.unregisterWebhook(context);
    },

    async test(context) {

        const checkout = await commons.fetchLatestExample(context, 'checkout');
        if (!checkout) {
            throw new Error('No recent abandoned checkouts to use as test data.');
        }

        return context.sendJson(checkout, 'checkout');
    }
};
