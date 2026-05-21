'use strict';

const crypto = require('crypto');

const GRAPH_VERSION = 'v25.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Cached Graph API GET — used by components that act as dynamic-source
 * dropdowns (isSource). Cache key = SHA-256 of { path, params, token }.
 * TTL defaults to 120 s, overridable via context.config.listCacheTTL.
 */
function getCacheKey(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

async function apiRequestCached(context, { path, params }) {

    const token = context.auth && context.auth.accessToken;
    const key = getCacheKey({ path, params, token });

    let lock;
    try {
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) return { data: cached };

        const { data } = await apiRequest(context, { method: 'GET', path, params });
        const ttl = (context.config && context.config.listCacheTTL) || (2 * 60 * 1000);
        await context.staticCache.set(key, data, ttl);
        return { data };
    } finally {
        lock && lock.unlock && lock.unlock();
    }
}

/**
 * Make an authorized request against the Meta Graph API. The caller passes
 * the path (e.g. `/{phone-number-id}/messages`). The OAuth access token
 * from the connected account is attached automatically.
 */
async function apiRequest(context, { method = 'GET', path, params, data, extraHeaders = {} }) {

    const accessToken = context.auth && context.auth.accessToken;
    if (!accessToken) {
        throw new context.CancelError('Access token missing. Re-authenticate the WhatsApp account.');
    }

    const response = await context.httpRequest({
        method,
        url: `${BASE_URL}${path}`,
        params,
        data,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...extraHeaders
        }
    });

    return response;
}

/**
 * Convenience wrapper for `POST /{phone-number-id}/messages`.
 * The caller passes phoneNumberId explicitly — each component takes it
 * from its own inspector field.
 */
async function sendMessage(context, phoneNumberId, payload) {

    if (!phoneNumberId) {
        throw new context.CancelError('Phone Number ID is required.');
    }

    const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...payload
    };

    const { data } = await apiRequest(context, {
        method: 'POST',
        path: `/${phoneNumberId}/messages`,
        data: body
    });

    return data;
}

/**
 * Normalise an E.164 phone number — strip spaces, parentheses and hyphens.
 * Leading "+" is preserved. The Cloud API accepts both formats but
 * normalising keeps the payload predictable.
 */
function sanitizePhoneNumber(input) {

    if (typeof input !== 'string') return input;
    return input.replace(/[\s()\-]/g, '');
}

/**
 * Verify the X-Hub-Signature-256 header sent by Meta on every webhook
 * payload. Returns `true` when the signature matches. `appSecret` is
 * the Appmixer Meta app secret (the OAuth clientSecret). When it is
 * not available the caller should skip signature verification.
 */
function verifyWebhookSignature({ rawBody, signatureHeader, appSecret }) {

    if (!signatureHeader || !appSecret || !rawBody) return false;

    const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    try {
        return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
    } catch (e) {
        return false;
    }
}

/**
 * Extract the inbound message and outbound status arrays from a Meta
 * webhook payload. Returns { messages, statuses, wabaId, phoneNumberId }.
 */
function parseWebhookPayload(body) {

    const out = { messages: [], statuses: [], wabaId: null, phoneNumberId: null };
    if (!body || body.object !== 'whatsapp_business_account') return out;

    for (const entry of (body.entry || [])) {
        out.wabaId = out.wabaId || entry.id;
        for (const change of (entry.changes || [])) {
            const value = change.value || {};
            out.phoneNumberId = out.phoneNumberId || (value.metadata && value.metadata.phone_number_id);
            if (Array.isArray(value.messages)) out.messages.push(...value.messages);
            if (Array.isArray(value.statuses)) out.statuses.push(...value.statuses);
        }
    }

    return out;
}

/**
 * Resolve the connected user's WABA — input override beats the OAuth-discovered default.
 */
function resolveWabaId(context) {

    const fromAuth = context.profileInfo && context.profileInfo.businessAccountId;
    return fromAuth || null;
}

/**
 * Subscribe the connected WABA to the Meta App. Required for any
 * inbound webhooks to be delivered to the App's globally-configured
 * callback URL. Idempotent — safe to call from every trigger's start().
 *
 * Requires whatsapp_business_management scope (already in auth.js).
 */
async function subscribeWabaApp(context, wabaId) {

    if (!wabaId) return null;

    const { data } = await apiRequest(context, {
        method: 'POST',
        path: `/${wabaId}/subscribed_apps`
    });

    return data;
}

/**
 * Unsubscribe the connected WABA from the Meta App. Best-effort cleanup
 * called from stop(). Note: other flows on the same WABA will lose
 * webhooks too — so use only when you know there's a single trigger.
 */
async function unsubscribeWabaApp(context, wabaId) {

    if (!wabaId) return null;

    const { data } = await apiRequest(context, {
        method: 'DELETE',
        path: `/${wabaId}/subscribed_apps`
    });

    return data;
}

module.exports = {
    GRAPH_VERSION,
    BASE_URL,
    apiRequest,
    apiRequestCached,
    sendMessage,
    sanitizePhoneNumber,
    verifyWebhookSignature,
    parseWebhookPayload,
    resolveWabaId,
    subscribeWabaApp,
    unsubscribeWabaApp
};
