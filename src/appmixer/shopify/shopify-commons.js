'use strict';
const Shopify = require('shopify-api-node');

const pager = async ({ shopify, target, operation, params = {} }) => {

    const currentPage = await shopify[target][operation](params);
    if (
        currentPage.length === 0 ||
        currentPage.length < (params.limit || 250) ||
        !currentPage.nextPageParameters
    ) {
        return currentPage;
    }

    params = currentPage.nextPageParameters;
    const nextPage = await pager({
        shopify,
        target,
        operation,
        params
    });
    return currentPage.concat(nextPage);
};

module.exports = {

    /**
     * Get Shopify API
     * @param {Object} auth
     * @returns {Shopify}
     */
    getShopifyAPI(auth) {

        return new Shopify({
            shopName: auth.store,
            accessToken: auth.accessToken,
            apiVersion: '2023-04'
        });
    },

    /**
     * Process items to find newly added.
     * @param {Set} knownItems
     * @param {Set} actualItems
     * @param {Set} newItems
     * @param {Object} item
     */
    processItems(knownItems, actualItems, newItems, item) {

        if (knownItems && !knownItems.has(item['id'])) {
            newItems.add(item);
        }
        actualItems.add(item['id']);
    },

    pager,

    /**
     * Create webhook.
     * @param {Context} context
     * @param {string} topic
     * @returns {Promise<*>}
     */
    async registerWebhook(context, topic) {

        const shopify = this.getShopifyAPI(context.auth);
        const address = context.getWebhookUrl();

        const webhooks =  await shopify.webhook.list({ address });

        let response;
        if (Array.isArray(webhooks) && webhooks.length > 0) {
            response = webhooks[0];
        } else {
            response = await shopify.webhook.create({ address, topic });
        }

        return context.saveState({ webhookId: response.id });
    },

    /**
     * Recieve data from webhook.
     * @param {Context} context
     * @param {string} port
     * @returns {Promise<*>}
     */
    async onReceive(context, port) {

        const { headers, data } = context.messages.webhook.content;

        data.webhookTopic = headers['x-shopify-topic'];
        await context.sendJson(data, port);

        return context.response();
    },

    /**
     * Fetch the most recent record to use as Flow Test Mode example data.
     * Shared by the webhook triggers' test() methods so the emitted shape matches
     * what onReceive() forwards in production (snake_case fields + webhookTopic).
     * Returns null when there is no record to use as an example.
     * @param {Context} context
     * @param {string} type - 'checkout' | 'return'
     * @returns {Promise<Object|null>}
     */
    async fetchLatestExample(context, type) {

        const shopify = this.getShopifyAPI(context.auth);

        if (type === 'checkout') {
            const checkouts = await shopify.checkout.list({ limit: 1 });
            const checkout = Array.isArray(checkouts) ? checkouts[0] : null;
            if (!checkout) {
                return null;
            }
            checkout.webhookTopic = 'checkouts/create';
            return checkout;
        }

        if (type === 'return') {
            const returnStatuses = [
                'return_status:RETURNED',
                'return_status:IN_PROGRESS',
                'return_status:RETURN_REQUESTED',
                'return_status:RETURN_FAILED'
            ].join(' OR ');
            const query = `query {
                orders(first: 1, sortKey: UPDATED_AT, reverse: true, query: "${returnStatuses}") {
                    edges {
                        node {
                            id
                            returns(first: 1) {
                                edges {
                                    node { id name status totalQuantity }
                                }
                            }
                        }
                    }
                }
            }`;

            const result = await shopify.graphql(query);
            const orderEdges = result && result.orders && result.orders.edges ? result.orders.edges : [];
            const orderNode = orderEdges.length ? orderEdges[0].node : null;
            const returns = orderNode && orderNode.returns ? orderNode.returns : null;
            const returnEdges = returns && returns.edges ? returns.edges : [];
            const returnNode = returnEdges.length ? returnEdges[0].node : null;
            if (!returnNode) {
                return null;
            }

            const gidToId = gid => {
                const match = /\/(\d+)$/.exec(gid || '');
                return match ? Number(match[1]) : gid;
            };

            return {
                id: gidToId(returnNode.id),
                order_id: gidToId(orderNode.id),
                name: returnNode.name,
                status: returnNode.status,
                total_quantity: returnNode.totalQuantity,
                webhookTopic: 'returns/update'
            };
        }

        return null;
    },

    /**
     * Delete webhook.
     * @param {Context} context
     * @returns {Promise<*>}
     */
    async unregisterWebhook(context) {

        const shopify = this.getShopifyAPI(context.auth);
        const { webhookId } = await context.loadState();

        if (webhookId) {
            return shopify.webhook.delete(webhookId);
        }
    }
};
