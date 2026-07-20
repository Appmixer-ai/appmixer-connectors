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
    },

    /**
     * Fetch the newest resource record (read-only) and reshape it into the exact
     * webhook payload `onReceive` emits (full resource object + `webhookTopic`).
     * Shared by every webhook trigger's `test()` so the emitted shape matches
     * production byte-for-byte.
     * @param {Context} context
     * @param {Object} options
     * @param {string} options.resource - Shopify resource name (e.g. 'customer', 'order', 'product').
     * @param {string} options.topic - The webhook topic the trigger registers (e.g. 'customers/create').
     * @param {Object} [options.params] - List query params (limit/order/status/...).
     * @returns {Promise<Object|null>} The reshaped webhook payload or null if none exists.
     */
    async fetchLatestWebhookExample(context, { resource, topic, params = {} }) {

        const shopify = this.getShopifyAPI(context.auth);
        const records = await shopify[resource].list({ limit: 1, ...params });

        const record = Array.isArray(records) ? records[0] : null;
        if (!record) {
            return null;
        }

        record.webhookTopic = topic;
        return record;
    },

    /**
     * Reconstruct the minimal delete-webhook payload from the newest existing
     * resource. Shopify delete webhooks deliver only the resource `id` (plus the
     * `webhookTopic` added by `onReceive`), so we emit exactly that minimal shape.
     * @param {Context} context
     * @param {Object} options
     * @param {string} options.resource - Shopify resource name (e.g. 'customer').
     * @param {string} options.topic - The delete webhook topic (e.g. 'customers/delete').
     * @returns {Promise<Object|null>} `{ id, webhookTopic }` or null if none exists.
     */
    async fetchLatestDeleteExample(context, { resource, topic, params = {} }) {

        const shopify = this.getShopifyAPI(context.auth);
        const listParams = resource === 'order' ? { status: 'any', ...params } : params;
        const records = await shopify[resource].list({ limit: 1, ...listParams });

        const record = Array.isArray(records) ? records[0] : null;
        if (!record) {
            return null;
        }

        return { id: record.id, webhookTopic: topic };
    },

    /**
     * Fetch the newest report (read-only), reusing the same list call `tick()` uses.
     * Used by NewReport's `test()` to avoid the first-run baseline suppression that
     * `tick()` performs against component state.
     * @param {Context} context
     * @returns {Promise<Object|null>} The newest report or null if none exists.
     */
    async fetchLatestReport(context) {

        const shopify = this.getShopifyAPI(context.auth);
        const reports = await shopify.report.list({ order: 'updated_at DESC', limit: 1 });

        return Array.isArray(reports) ? (reports[0] || null) : null;
    },

    /**
     * Fetch the newest order-scoped child record (refund/fulfillment) and reshape
     * it into the webhook payload shape (`+ webhookTopic`). Refunds and fulfillments
     * are nested under orders, so we scan recent orders until one has a child.
     * @param {Context} context
     * @param {Object} options
     * @param {'refund'|'fulfillment'} options.child - Order-scoped resource name.
     * @param {string} options.topic - The webhook topic (e.g. 'refunds/create').
     * @returns {Promise<Object|null>} The child record + webhookTopic, or null.
     */
    async fetchLatestOrderChildExample(context, { child, topic }) {

        const shopify = this.getShopifyAPI(context.auth);
        const orders = await shopify.order.list({ status: 'any', limit: 20, order: 'created_at DESC' });

        if (!Array.isArray(orders)) {
            return null;
        }

        for (const order of orders) {
            const children = await shopify[child].list(order.id, { limit: 1 });
            if (Array.isArray(children) && children[0]) {
                const record = children[0];
                record.webhookTopic = topic;
                return record;
            }
        }

        return null;
    },

    /**
     * Fetch the newest inventory level (reshaped into the webhook payload shape).
     * `inventoryLevel.list` requires a location or inventory-item filter, so we
     * resolve the first location and query its levels.
     * @param {Context} context
     * @param {string} topic - The webhook topic (e.g. 'inventory_levels/update').
     * @returns {Promise<Object|null>} The inventory level + webhookTopic, or null.
     */
    async fetchLatestInventoryLevelExample(context, topic) {

        const shopify = this.getShopifyAPI(context.auth);
        const locations = await shopify.location.list({ limit: 1 });
        const location = Array.isArray(locations) ? locations[0] : null;

        if (!location) {
            return null;
        }

        const levels = await shopify.inventoryLevel.list({ location_ids: String(location.id), limit: 1 });
        const level = Array.isArray(levels) ? levels[0] : null;

        if (!level) {
            return null;
        }

        level.webhookTopic = topic;
        return level;
    },

    /**
     * Register a webhook using a specific Shopify API version. Needed for topics
     * that only exist on newer versions than the connector default (e.g. the
     * Returns API topics require 2023-10+), without changing every other call.
     * @param {Context} context
     * @param {string} topic
     * @param {string} apiVersion
     * @returns {Promise<*>}
     */
    async registerWebhookVersioned(context, topic, apiVersion) {

        const shopify = new Shopify({
            shopName: context.auth.store,
            accessToken: context.auth.accessToken,
            apiVersion
        });
        const address = context.getWebhookUrl();

        const webhooks = await shopify.webhook.list({ address });

        let response;
        if (Array.isArray(webhooks) && webhooks.length > 0) {
            response = webhooks[0];
        } else {
            response = await shopify.webhook.create({ address, topic });
        }

        return context.saveState({ webhookId: response.id });
    }
};
