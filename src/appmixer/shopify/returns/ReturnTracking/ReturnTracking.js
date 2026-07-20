'use strict';
const commons = require('../../shopify-commons');

// The Returns API (and its webhook topics) only exists on newer Shopify API
// versions than the connector default (2023-04), so this trigger registers its
// webhook and reads sample data through a version-pinned client.
const RETURNS_API_VERSION = '2024-04';
const TOPIC = 'returns/update';

module.exports = {

    async start(context) {

        return commons.registerWebhookVersioned(context, TOPIC, RETURNS_API_VERSION);
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

        const shopify = commons.getShopifyAPI(context.auth);
        // Returns are GraphQL-only in this library; fetch the newest return of the
        // most recent order so the emitted shape matches the webhook payload.
        const orders = await shopify.order.list({ status: 'any', limit: 10, order: 'created_at DESC' });

        if (!Array.isArray(orders)) {
            throw new Error('No orders to look up returns for.');
        }

        const versioned = commons.getShopifyAPI({ ...context.auth });
        versioned.options.apiVersion = RETURNS_API_VERSION;

        for (const order of orders) {
            const query = `query {
                order(id: "gid://shopify/Order/${order.id}") {
                    returns(first: 1) {
                        edges { node {
                            id name status totalQuantity
                            order { id name }
                        } }
                    }
                }
            }`;
            let result;
            try {
                result = await versioned.graphql(query);
            } catch (err) {
                continue;
            }
            const edges = result && result.order && result.order.returns && result.order.returns.edges;
            if (Array.isArray(edges) && edges[0]) {
                const node = edges[0].node;
                return context.sendJson({ ...node, webhookTopic: TOPIC }, 'return');
            }
        }

        throw new Error('No returns to use as test data. Ensure the store has returns and the token has read_returns scope.');
    }
};
