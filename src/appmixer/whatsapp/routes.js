/* eslint-disable camelcase */
'use strict';

const lib = require('./lib');

// One global endpoint per Meta App:
//   <API_BASE>/plugins/appmixer/whatsapp/events
//
// Meta App admin configures this URL once as the App's webhook callback. All
// connected customers' events for this Appmixer tenant land here. The plugin
// parses each entry, identifies its WABA, and fans events out to listener
// instances (trigger components) subscribed to that WABA via addListener().

module.exports = async context => {

    /**
     * Validation step that runs every time a trigger calls addListener().
     * Currently a lightweight passthrough — listener.params already carries
     * the trigger's accessToken and wabaId.
     *
     * Extend here if we ever need to verify the user actually owns the WABA
     * they're trying to subscribe to (defends against a malicious user
     * subscribing to someone else's wabaId).
     */
    context.onListenerAdded(async listener => {

        const { wabaId } = listener.params || {};
        if (!wabaId) {
            throw new Error('WhatsApp listener requires params.wabaId.');
        }
        // Pass-through. Could be extended with a /debug_token call to
        // confirm the user's token grants access to wabaId.
    });

    context.http.router.register({
        method: 'POST',
        path: '/events',
        options: {
            auth: false,
            handler: async (req, h) => {

                // await context.log('info', `whatsapp-plugin-route-event-hit: ${JSON.stringify(req.payload?.object)}`);

                // HMAC verification — uses Meta App secret exposed via plugin config.
                if (!isValidPayload(context, req)) {
                    return h.response(undefined).code(401);
                }

                await context.log('info', `whatsapp-plugin-route-event-hit paylod: ${JSON.stringify(req.payload)}`);

                const body = req.payload;
                if (!body || body.object !== 'whatsapp_business_account') {
                    return {};
                }

                await processWebhook(context, body);
                return {};
            }
        }
    });

    // Meta webhook URL verification handshake — Meta sends GET with
    // hub.mode=subscribe, hub.verify_token, hub.challenge.
    context.http.router.register({
        method: 'GET',
        path: '/events',
        options: {
            auth: false,
            handler: async (req, h) => {

                const mode = req.query?.['hub.mode'];
                const challenge = req.query?.['hub.challenge'];
                const verifyToken = req.query?.['hub.verify_token'];

                const expected = context.config?.verifyToken;

                if (mode === 'subscribe' && expected && verifyToken === expected) {
                    return h.response(challenge).type('text/plain').code(200);
                }

                return h.response(undefined).code(403);
            }
        }
    });
};

/**
 * Validate X-Hub-Signature-256 against the raw payload using the Meta App
 * secret. When the secret isn't configured we log and skip — the caller
 * still treats the request as valid (better than locking the user out
 * during initial setup).
 */
function isValidPayload(context, req) {

    const appSecret = context.config?.clientSecret;
    if (!appSecret) {
        context.log('warn', 'whatsapp-plugin-route-event-missing-clientSecret');
        return true;
    }

    const signature = req.headers['x-hub-signature-256'];
    const rawBody = Buffer.isBuffer(req.payload) ? req.payload : null;

    // Some servers parse JSON before us — we can't HMAC-verify a parsed body.
    // Fall back to stringifying with no extra escaping; this is best-effort.
    const payloadString = rawBody
        ? rawBody.toString('utf8')
        : (typeof req.payload === 'string' ? req.payload : JSON.stringify(req.payload));

    const ok = lib.verifyWebhookSignature({
        rawBody: payloadString,
        signatureHeader: signature,
        appSecret
    });

    if (!ok) {
        context.log('error', 'whatsapp-plugin-route-event-invalid-signature');
    }

    return ok;
}

/**
 * Fan out the Meta webhook payload to listeners.
 *
 *   entry[].id            = WABA ID
 *   entry[].changes[]     = events
 *     value.messages[]    = inbound messages
 *     value.statuses[]    = outbound status updates
 *
 * Emits one listener event per message / per status, keyed on:
 *   messages:<wabaId>  →  NewMessage triggers
 *   statuses:<wabaId>  →  MessageStatusUpdated triggers
 */
async function processWebhook(context, body) {

    for (const entry of (body.entry || [])) {
        const wabaId = entry.id;
        if (!wabaId) continue;

        for (const change of (entry.changes || [])) {
            const value = change.value || {};
            const phoneNumberId = value.metadata && value.metadata.phone_number_id;

            if (Array.isArray(value.messages)) {
                for (const msg of value.messages) {
                    await context.triggerListeners({
                        eventName: `messages:${wabaId}`,
                        payload: { ...msg, wabaId, phoneNumberId }
                    });
                }
            }

            if (Array.isArray(value.statuses)) {
                for (const status of value.statuses) {
                    await context.triggerListeners({
                        eventName: `statuses:${wabaId}`,
                        payload: {
                            id: status.id,
                            recipientId: status.recipient_id,
                            status: status.status,
                            timestamp: status.timestamp,
                            conversation: status.conversation,
                            errors: status.errors,
                            wabaId,
                            phoneNumberId
                        }
                    });
                }
            }
        }
    }
}
