'use strict';

// Shopify Admin API accessed directly through context.httpRequest — no
// third-party client. Every resource goes through the GraphQL Admin API
// (graphql-client.js + gql-*.js); the facade returned by getShopifyAPI(context)
// keeps the REST object shapes (snake_case keys, numeric ids) the components
// and their users' flows were built on. This module provides:
//   - a throttled, 429-aware request layer,
//   - the getShopifyAPI(context) facade,
//   - webhook registration and the shared output helpers.

const pathModule = require('path');
const graphqlClient = require('./graphql-client');
const gqlCustomers = require('./gql-customers');
const gqlOrders = require('./gql-orders');
const gqlProducts = require('./gql-products');
const gqlDiscounts = require('./gql-discounts');
const gqlStore = require('./gql-store');

const DEFAULT_API_VERSION = graphqlClient.API_VERSION;
const MIN_REQUEST_INTERVAL_MS = 500; // ~2 requests/second
const MAX_429_RETRIES = 4;
const DEFAULT_EXPORT_PREFIX = 'shopify-objects-export';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Serialize every Shopify call through a single chain with a minimum spacing so
// we stay under the leaky-bucket limit without a dependency.
let requestChain = Promise.resolve();
let lastRequestAt = 0;

function schedule(task) {

    const run = async () => {
        const wait = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
        if (wait > 0) {
            await sleep(wait);
        }
        lastRequestAt = Date.now();
        return task();
    };

    requestChain = requestChain.then(run, run);
    return requestChain;
}

// The store handle is the only part of the request host that comes from user
// input, and both the access token and the app's client secret are sent to that
// host — so anything but a plain myshopify.com handle is rejected.
const STORE_HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

function normalizeStore(store) {

    const handle = String(store || '').trim().replace(/\.myshopify\.com$/i, '');
    if (!STORE_HANDLE_PATTERN.test(handle)) {
        throw new Error('Invalid Shopify store address. Enter the store name only, without .myshopify.com.');
    }
    return handle.toLowerCase();
}

function baseUrl(auth, apiVersion) {

    return `https://${normalizeStore(auth.store)}.myshopify.com/admin/api/${apiVersion || DEFAULT_API_VERSION}`;
}

// Low-level request with throttling and 429 (Retry-After) handling. Returns the
// parsed body plus the response headers (needed for pagination).
async function shopifyRequest(context, { method = 'GET', path, query, body, apiVersion }) {

    // In component contexts the credentials live on context.auth; in the auth
    // module (validate/requestProfileInfo) they are on the context itself.
    const auth = context.auth || context;
    const url = `${baseUrl(auth, apiVersion)}/${path}`;
    const options = {
        method,
        url,
        headers: {
            'X-Shopify-Access-Token': auth.accessToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    if (query && Object.keys(query).length) {
        options.params = query;
    }
    if (body !== undefined) {
        options.data = body;
    }

    for (let attempt = 0; ; attempt++) {
        try {
            const response = await schedule(() => context.httpRequest(options));
            return { data: response.data, headers: response.headers || {} };
        } catch (error) {
            const status = error.response && error.response.status;
            if (status === 429 && attempt < MAX_429_RETRIES) {
                const retryAfter = Number((error.response.headers || {})['retry-after']) || 1;
                await sleep(retryAfter * 1000);
                continue;
            }
            // Normalize so callers can branch on err.statusCode like the old client.
            if (status && error.statusCode === undefined) {
                error.statusCode = status;
                error.statusMessage = error.response.statusText;
            }
            throw error;
        }
    }
}

module.exports = {

    normalizeStore,

    /**
     * Normalize multiselect input (array or string) to array format.
     * @param {string|string[]} input
     * @param {object} context
     * @param {string} fieldName
     * @returns {string[]}
     */
    normalizeMultiselectInput(input, context, fieldName) {

        if (Array.isArray(input)) {
            return input;
        } else if (typeof input === 'string') {
            return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else {
            throw new context.CancelError(`${fieldName} must be a string or an array`);
        }
    },

    /**
     * Emit an array of records on an output port honoring the selected outputType
     * (first / array / object / file). Array output is always under `result`.
     * @param {object} params
     * @param {Context} params.context
     * @param {string} [params.outputPortName='out']
     * @param {string} [params.outputType='array']
     * @param {Array<object>} [params.records=[]]
     */
    async sendArrayOutput({
        context,
        outputPortName = 'out',
        outputType = 'array',
        records = []
    }) {

        if (outputType === 'first') {
            if (records.length === 0) {
                throw new context.CancelError('No records available for first output type');
            }
            await context.sendJson(
                { ...records[0], index: 0, count: records.length },
                outputPortName
            );
        } else if (outputType === 'object') {
            for (let index = 0; index < records.length; index++) {
                await context.sendJson(
                    { ...records[index], index, count: records.length },
                    outputPortName
                );
            }
        } else if (outputType === 'array') {
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {
            const csvString = toCsv(records);
            const buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_EXPORT_PREFIX}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);

            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    /**
     * Build the dynamic output-port options for an outputType component from a
     * single-item schema. Call from receive() when
     * context.properties.generateOutputPortOptions is set.
     * @param {Context} context
     * @param {string} outputType
     * @param {object} itemSchema map of field -> JSON schema (with title)
     * @param {object} arrayOption { label, value } for the array wrapper
     */
    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: fieldLabel, ...schemaWithoutTitle } = schema;

                    res.push({ label: fieldLabel, value: field, schema: schemaWithoutTitle });
                    return res;
                }, [{
                    label: 'Current Item Index',
                    value: 'index',
                    schema: { type: 'integer' }
                }, {
                    label: 'Items Count',
                    value: 'count',
                    schema: { type: 'integer' }
                }]);

            return context.sendJson(options, 'out');
        }

        if (outputType === 'array') {
            return context.sendJson([{
                label,
                value,
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    },

    /**
     * Build a ShopifyQL query string for a curated report component.
     * @param {string} dataset e.g. 'sales', 'payments'
     * @param {string[]} metrics columns to SHOW
     * @param {object} opts { since, until, groupBy }
     * @returns {string}
     */
    buildReportQuery(dataset, metrics, { since = '-30d', until = 'today', groupBy } = {}) {

        let query = `FROM ${dataset} SHOW ${metrics.join(', ')} SINCE ${since} UNTIL ${until}`;
        if (groupBy && groupBy !== 'none') {
            query += ` GROUP BY ${groupBy} ORDER BY ${groupBy}`;
        }
        return query;
    },

    /**
     * Run a ShopifyQL query (GraphQL shopifyqlQuery) and normalize the result to
     * { columns, rows, rowCount }. Throws a CancelError on ShopifyQL parse errors.
     * Shared by RunReport and the curated report components.
     * @param {Context} context
     * @param {string} query
     */
    async runReport(context, query) {

        const shopify = this.getShopifyAPI(context);
        const response = await shopify.report.run(query);

        const parseErrors = (response && response.parseErrors) || [];
        if (parseErrors.length) {
            throw new context.CancelError('Invalid ShopifyQL query: ' + parseErrors.join('; '));
        }

        const tableData = (response && response.tableData) || { columns: [], rows: [] };
        const columns = tableData.columns || [];
        const rows = tableData.rows || [];

        return { columns, rows, rowCount: rows.length };
    },

    /**
     * Facade over the Shopify Admin API. Method shapes mirror the REST resources
     * the components were written against; underneath, every call is a GraphQL
     * Admin API query or mutation (gql-*.js), mapped back to the REST shape.
     * Requires the full `context` (for context.httpRequest).
     * @param {Context} context
     */
    getShopifyAPI(context) {

        const run = (query, variables) => graphqlClient.gql(context, query, variables, shopifyRequest);

        const customers = gqlCustomers(run);
        const orders = gqlOrders(run);
        const store = gqlStore(run);
        const products = gqlProducts(run, {
            // Base64 image attachments go to a staged upload target first.
            putFile: (url, data, headers) => context.httpRequest({ method: 'PUT', url, data, headers })
        });

        return {
            customer: {
                ...customers,
                orders: (id, query) => orders.listForCustomer(id, query)
            },
            order: orders.order,
            // Refunds and fulfillments are nested under an order.
            refund: orders.refund,
            fulfillment: orders.fulfillment,
            product: products,
            location: store.location,
            inventoryLevel: store.inventoryLevel,
            checkout: store.checkout,
            draftOrder: store.draftOrder,
            webhook: store.webhook,
            shop: store.shop,
            returnsForOrder: (orderId, limit) => store.returnsForOrder(orderId, limit),
            // Code discounts (the GraphQL Admin API has no price rules).
            discount: gqlDiscounts(run),

            // Run a ShopifyQL query and return the table result.
            report: {
                async run(query) {
                    const gql = `query RunShopifyql($q: String!) {
                        shopifyqlQuery(query: $q) {
                            parseErrors
                            tableData {
                                columns { name displayName dataType }
                                rows
                            }
                        }
                    }`;
                    const data = await run(gql, { q: query });
                    return data.shopifyqlQuery;
                }
            },

            // Raw GraphQL (returns the `data` payload).
            graphql: (query, variables) => run(query, variables)
        };
    },

    /**
     * Follow Shopify cursor pagination until all pages are collected.
     * Kept signature-compatible with the previous client-based pager.
     */
    async pager({ shopify, target, operation, params = {} }) {

        const currentPage = await shopify[target][operation](params);
        if (
            currentPage.length === 0 ||
            currentPage.length < (params.limit || 250) ||
            !currentPage.nextPageParameters
        ) {
            return currentPage;
        }

        const nextPage = await this.pager({
            shopify,
            target,
            operation,
            params: currentPage.nextPageParameters
        });
        return currentPage.concat(nextPage);
    },

    processItems(knownItems, actualItems, newItems, item) {

        if (knownItems && !knownItems.has(item['id'])) {
            newItems.add(item);
        }
        actualItems.add(item['id']);
    },

    async registerWebhook(context, topic) {

        const shopify = this.getShopifyAPI(context);
        const address = context.getWebhookUrl();

        const webhooks = await shopify.webhook.list({ address });
        const existing = (webhooks || []).find(webhook => webhook.topic === topic);
        const webhook = existing || await shopify.webhook.create({ address, topic });

        return context.saveState({ webhookId: webhook.id });
    },

    // Registers one webhook per topic (Return Tracking subscribes to the whole
    // returns/* family), reusing subscriptions already pointing at this component.
    async registerWebhooks(context, topics) {

        const shopify = this.getShopifyAPI(context);
        const address = context.getWebhookUrl();

        const existing = new Map((await shopify.webhook.list({ address })).map(webhook => [webhook.topic, webhook.id]));

        const webhookIds = [];
        for (const topic of topics) {
            const id = existing.has(topic)
                ? existing.get(topic)
                : (await shopify.webhook.create({ address, topic })).id;
            webhookIds.push(id);
        }

        return context.saveState({ webhookIds });
    },

    async onReceive(context, port) {

        const { headers, data } = context.messages.webhook.content;

        data.webhookTopic = headers['x-shopify-topic'];
        await context.sendJson(data, port);

        return context.response();
    },

    async unregisterWebhook(context) {

        const shopify = this.getShopifyAPI(context);
        const { webhookId, webhookIds } = await context.loadState();

        // Subscriptions registered before 3.1.0 carry a gid (GraphQL) or a number
        // (REST); webhook.delete takes both.
        const ids = Array.isArray(webhookIds) ? webhookIds : (webhookId ? [webhookId] : []);
        return Promise.all(ids.map(id => shopify.webhook.delete(id).catch(() => {})));
    },

    async fetchLatestWebhookExample(context, { resource, topic, params = {} }) {

        const shopify = this.getShopifyAPI(context);
        const records = await shopify[resource].list({ limit: 1, ...params });

        const record = Array.isArray(records) ? records[0] : null;
        if (!record) {
            return null;
        }

        record.webhookTopic = topic;
        return record;
    },

    async fetchLatestDeleteExample(context, { resource, topic, params = {} }) {

        const shopify = this.getShopifyAPI(context);
        const listParams = resource === 'order' ? { status: 'any', ...params } : params;
        const records = await shopify[resource].list({ limit: 1, ...listParams });

        const record = Array.isArray(records) ? records[0] : null;
        if (!record) {
            return null;
        }

        return { id: record.id, webhookTopic: topic };
    },

    async fetchLatestOrderChildExample(context, { child, topic }) {

        const shopify = this.getShopifyAPI(context);
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

    async fetchLatestInventoryLevelExample(context, topic) {

        const shopify = this.getShopifyAPI(context);
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
    }
};

/**
 * Serialize an array of flat objects to CSV.
 * @param {Array<object>} array
 * @returns {string}
 */
function toCsv(array) {
    if (!array || array.length === 0) {
        return '';
    }

    const headers = Object.keys(array[0]);
    if (headers.length === 0) {
        return '';
    }

    return [
        headers.join(','),
        ...array.map(items => {
            return Object.values(items).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property != null ? property : '';
            }).join(',');
        })
    ].join('\n');
}
