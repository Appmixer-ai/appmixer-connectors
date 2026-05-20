'use strict';

const crypto = require('crypto');

const GRAPH_VERSION = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Make an authorized request against the Meta Graph API. The caller passes
 * the path (e.g. `/{phone-number-id}/messages`). Auth header is attached
 * automatically.
 */
async function apiRequest(context, { method = 'GET', path, params, data, extraHeaders = {} }) {

    const accessToken = context.auth && context.auth.accessToken;
    if (!accessToken) {
        throw new context.CancelError('Access Token is missing. Re-authenticate the WhatsApp account.');
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
 * Throws CancelError when phoneNumberId is missing.
 */
async function sendMessage(context, payload) {

    const phoneNumberId = context.auth && context.auth.phoneNumberId;
    if (!phoneNumberId) {
        throw new context.CancelError('Phone Number ID is missing. Set it in the auth account.');
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
 * payload. Returns `true` when the signature matches.
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
 * Subscribe a webhook callback URL on the Meta App level.
 * Mirrors the n8n WhatsAppTrigger flow:
 *   POST /{app-id}/subscriptions
 */
async function subscribeAppWebhook(context, { callbackUrl, verifyToken, fields }) {

    const { appId, appSecret } = context.auth || {};
    if (!appId || !appSecret) {
        throw new context.CancelError('Meta App ID and App Secret are required for webhook triggers. Add them to the WhatsApp auth account.');
    }

    // App-level access token = "<app-id>|<app-secret>"
    const appAccessToken = `${appId}|${appSecret}`;

    const { data } = await context.httpRequest({
        method: 'POST',
        url: `${BASE_URL}/${appId}/subscriptions`,
        data: {
            object: 'whatsapp_business_account',
            callback_url: callbackUrl,
            verify_token: verifyToken,
            fields: JSON.stringify(fields),
            include_values: true
        },
        headers: {
            'Authorization': `Bearer ${appAccessToken}`,
            'Content-Type': 'application/json'
        }
    });

    return data;
}

async function unsubscribeAppWebhook(context) {

    const { appId, appSecret } = context.auth || {};
    if (!appId || !appSecret) return;

    const appAccessToken = `${appId}|${appSecret}`;

    await context.httpRequest({
        method: 'DELETE',
        url: `${BASE_URL}/${appId}/subscriptions`,
        params: { object: 'whatsapp_business_account' },
        headers: { 'Authorization': `Bearer ${appAccessToken}` }
    });
}

/**
 * Extract the inbound message and outbound status arrays from a Meta
 * webhook payload. Returns { messages: [...], statuses: [...], wabaId, phoneNumberId }
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

module.exports = {
    GRAPH_VERSION,
    BASE_URL,
    apiRequest,
    sendMessage,
    sanitizePhoneNumber,
    verifyWebhookSignature,
    subscribeAppWebhook,
    unsubscribeAppWebhook,
    parseWebhookPayload
};
