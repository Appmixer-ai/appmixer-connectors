'use strict';

const STRIPE_API_BASE = 'https://api.stripe.com';

// The subscription, checkout, payment link, invoice item and webhook components send
// this version, so their parameters (e.g. `pricing[price]` on invoice items) and the
// shape of the objects they return do not depend on the account's default API version.
// https://docs.stripe.com/api/versioning
const STRIPE_API_VERSION = '2026-10-28.endive';

/**
 * Append one value to URLSearchParams in Stripe's bracket notation:
 * `metadata[key]=value`, `line_items[0][price]=price_123`.
 * `undefined`/`null` values are skipped.
 */
function appendFormValue(params, key, value) {

    if (value === undefined || value === null) {
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => appendFormValue(params, `${key}[${index}]`, item));
        return;
    }
    if (typeof value === 'object') {
        Object.entries(value).forEach(([childKey, childValue]) => {
            appendFormValue(params, `${key}[${childKey}]`, childValue);
        });
        return;
    }
    params.append(key, String(value));
}

/**
 * Encode an object as application/x-www-form-urlencoded the way the Stripe API reads it.
 * @param {object} data
 * @returns {string}
 */
function toFormBody(data) {

    const params = new URLSearchParams();
    Object.entries(data || {}).forEach(([key, value]) => appendFormValue(params, key, value));
    return params.toString();
}

/**
 * Call the Stripe API with the connected account's secret key.
 * `data` is sent as a form-encoded body, `params` as the query string (both in
 * bracket notation). Returns the response body.
 */
async function stripeRequest(context, { method = 'GET', path, data, params }) {

    const query = params ? toFormBody(params) : '';
    const options = {
        method,
        url: `${STRIPE_API_BASE}${path}${query ? `?${query}` : ''}`,
        headers: {
            'Authorization': `Bearer ${context.auth.apiKey}`,
            'Stripe-Version': STRIPE_API_VERSION
        }
    };
    if (data) {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.data = toFormBody(data);
    }

    const response = await context.httpRequest(options);
    return response.data;
}

/**
 * Treat empty strings like missing values: inspector fields the user cleared arrive as ''.
 */
function isSet(value) {

    return value !== undefined && value !== null && value !== '';
}

/**
 * Convert a key-value inspector input into a plain object. The Designer stores the
 * rows as the JSON string of an object ('{"orderId":"1001"}'); a plain object and
 * an array of {key, value} rows (also as a JSON string) are accepted too.
 * @param {object} context
 * @param {string|object|Array<{key: string, value: *}>} value
 * @param {string} label input label for the error message
 * @returns {object}
 */
function kvToObject(context, value, label) {

    let input = value;
    if (typeof input === 'string') {
        if (!input.trim()) {
            return {};
        }
        try {
            input = JSON.parse(input);
        } catch (error) {
            throw new context.CancelError(`${label} must be a JSON object of key-value pairs.`);
        }
    }
    if (!input || typeof input !== 'object') {
        return {};
    }
    const entries = Array.isArray(input)
        ? input.filter(row => row && typeof row === 'object').map(row => [row.key, row.value])
        : Object.entries(input);
    const result = {};
    for (const [key, val] of entries) {
        if (typeof key !== 'string' || !key) {
            continue;
        }
        result[key] = val === undefined || val === null ? '' : String(val);
    }
    return result;
}

/**
 * Normalize multiselect input (array or string) to an array.
 * Strings are treated as single values or comma-separated lists.
 * @param {string|string[]} input
 * @param {object} context
 * @param {string} fieldName human readable name for the error message
 * @returns {string[]}
 */
function normalizeMultiselectInput(input, context, fieldName) {

    if (Array.isArray(input)) {
        return input;
    } else if (typeof input === 'string') {
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else {
        throw new context.CancelError(`${fieldName} must be a string or an array`);
    }
}

/**
 * Turn the Line Items input into Stripe line items `[{ price, quantity }]`.
 * Accepts the inspector's expression value (`{ AND: [{ price, quantity }] }`),
 * an array of items, or the JSON string of either (a value mapped from a variable).
 * Rows without a price are skipped; the quantity defaults to 1.
 * @param {object} context
 * @param {object|Array|string} value
 * @param {string} label input label for the error message
 * @returns {Array<{price: string, quantity: number}>}
 */
function normalizeLineItems(context, value, label = 'Line Items') {

    let input = value;
    if (typeof input === 'string') {
        if (!input.trim()) {
            return [];
        }
        try {
            input = JSON.parse(input);
        } catch (error) {
            throw new context.CancelError(`${label} must be a list of items with a price ID and a quantity.`);
        }
    }
    if (!input) {
        return [];
    }

    const rows = Array.isArray(input) ? input : (input.AND || input.OR || []);
    if (!Array.isArray(rows)) {
        throw new context.CancelError(`${label} must be a list of items with a price ID and a quantity.`);
    }

    return rows
        .filter(row => row && isSet(row.price))
        .map(row => {
            const quantity = isSet(row.quantity) ? Number(row.quantity) : 1;
            if (!Number.isInteger(quantity) || quantity < 1) {
                throw new context.CancelError(`${label}: the quantity of ${row.price} must be a whole number of at least 1.`);
            }
            return { price: String(row.price).trim(), quantity };
        });
}

// ---------------------------------------------------------------------------
// Webhook triggers
// ---------------------------------------------------------------------------

/**
 * The trigger output for one Stripe event. Shared by receive() and test().
 */
function toEventOutput(event) {

    const output = {
        id: event.id,
        type: event.type,
        created: event.created,
        livemode: event.livemode,
        data: event.data?.object || {}
    };
    if (event.data?.previous_attributes) {
        output.previousAttributes = event.data.previous_attributes;
    }
    return output;
}

/**
 * Register a webhook endpoint for this trigger and keep its ID in the state.
 * https://docs.stripe.com/api/webhook_endpoints/create
 */
async function registerWebhook(context, enabledEvents) {

    const endpoint = await stripeRequest(context, {
        method: 'POST',
        path: '/v1/webhook_endpoints',
        data: {
            url: context.getWebhookUrl(),
            enabled_events: enabledEvents,
            description: `Appmixer flow ${context.flowId || ''}`.trim(),
            metadata: {
                appmixerFlowId: context.flowId,
                appmixerComponentId: context.componentId
            }
        }
    });

    return context.saveState({ webhookId: endpoint.id });
}

/**
 * Delete the webhook endpoint the trigger registered. An endpoint that is already
 * gone (deleted in the Dashboard) is not an error.
 * https://docs.stripe.com/api/webhook_endpoints/delete
 */
async function unregisterWebhook(context) {

    const { webhookId } = (await context.loadState()) || {};
    if (!webhookId) {
        return;
    }
    try {
        await stripeRequest(context, { method: 'DELETE', path: `/v1/webhook_endpoints/${encodeURIComponent(webhookId)}` });
    } catch (error) {
        if (error?.response?.status !== 404) {
            throw error;
        }
    }
}

/**
 * Handle one webhook delivery. The payload is not trusted: the component has no access
 * to the raw request body Stripe signs, so the event is read back from the Stripe API
 * with the account's key instead. A forged or foreign event ID is not found there and
 * emits nothing. Events of other types and repeated deliveries are skipped.
 */
async function receiveEvent(context, enabledEvents) {

    const payload = context.messages.webhook.content.data || {};
    const eventId = payload.id;

    if (typeof eventId !== 'string' || !/^evt_[A-Za-z0-9_]+$/.test(eventId)) {
        await context.log({ step: 'Ignoring a webhook request without a Stripe event ID.' });
        return context.response({}, 400);
    }

    let lock;
    try {
        lock = await context.lock(`stripe-webhook-${context.componentId}-${eventId}`, {
            ttl: 1000 * 30,
            retryDelay: 500,
            maxRetryCount: 6
        });

        const cacheKey = `stripe-webhook-event-${context.componentId}-${eventId}`;
        if (await context.staticCache.get(cacheKey)) {
            return context.response();
        }

        let event;
        try {
            event = await stripeRequest(context, { path: `/v1/events/${encodeURIComponent(eventId)}` });
        } catch (error) {
            if (error?.response?.status === 404) {
                await context.log({ step: 'Ignoring a webhook: the event is not in the connected Stripe account.', eventId });
                return context.response({}, 400);
            }
            throw error;
        }

        if (!enabledEvents.includes(event.type)) {
            return context.response();
        }

        await context.sendJson(toEventOutput(event), 'out');
        // Stripe retries a delivery it considers failed; remember the event for a day.
        await context.staticCache.set(cacheKey, true, 24 * 60 * 60 * 1000);
    } finally {
        await lock?.unlock();
    }

    return context.response();
}

/**
 * The most recent event of the trigger's types, shaped like receive() emits it, for
 * Flow Test Mode. Read-only; throws when Stripe has no such event.
 * https://docs.stripe.com/api/events/list
 */
async function latestEventOutput(context, enabledEvents) {

    const list = await stripeRequest(context, {
        path: '/v1/events',
        params: { types: enabledEvents, limit: 1 }
    });
    const event = list?.data?.[0];
    if (!event) {
        throw new context.CancelError(
            `No recent ${enabledEvents.join(', ')} event in this Stripe account (Stripe keeps events for 30 days). ` +
            'Start the flow and cause the event in Stripe to receive real data.'
        );
    }
    return toEventOutput(event);
}

module.exports = {
    STRIPE_API_BASE,
    STRIPE_API_VERSION,
    toFormBody,
    stripeRequest,
    isSet,
    kvToObject,
    normalizeMultiselectInput,
    normalizeLineItems,
    toEventOutput,
    registerWebhook,
    unregisterWebhook,
    receiveEvent,
    latestEventOutput
};
