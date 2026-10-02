'use strict';
const commons = require('../../lib');

// Each step of the return journey fires its own webhook topic (a customer
// request fires returns/request, an admin approval returns/approve, ...) —
// returns/update alone never fires during the standard journey, so the
// trigger subscribes to every selected topic and emits the topic name.
const TOPICS = [
    'returns/request',
    'returns/approve',
    'returns/decline',
    'returns/cancel',
    'returns/close',
    'returns/reopen',
    'returns/update'
];

module.exports = {

    async start(context) {

        let topics = context.properties.topics
            ? commons.normalizeMultiselectInput(context.properties.topics, context, 'Return Events')
            : [];
        topics = topics.filter(topic => TOPICS.includes(topic));
        if (!topics.length) {
            topics = TOPICS;
        }
        return commons.registerWebhooks(context, topics);
    },

    async receive(context) {

        if (context.messages.webhook) {
            return commons.onReceive(context, 'return');
        }
    },

    async stop(context) {

        return commons.unregisterWebhook(context);
    },

    async test(context) {

        const shopify = commons.getShopifyAPI(context);
        // Emit the newest return of the most recent orders, in the shape of the
        // webhook payload.
        const orders = await shopify.order.list({ status: 'any', limit: 10, order: 'created_at DESC' });

        for (const order of orders) {
            const [latest] = await shopify.returnsForOrder(order.id, 1);
            if (latest) {
                return context.sendJson({ ...latest, webhookTopic: 'returns/request' }, 'return');
            }
        }

        throw new Error('No returns to use as test data. Ensure the store has returns and the token has read_returns scope.');
    }
};
