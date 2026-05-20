'use strict';

const lib = require('../../lib');

// NOTE on webhook setup
// ---------------------
// Meta does not let an OAuth'd end-user manage their own webhook subscription on a
// Meta App — that requires the App's clientId + clientSecret, which belong to the
// Appmixer instance (not the connected user). Two consequences:
//
//   1. This trigger does NOT auto-subscribe. The Appmixer operator must configure
//      the Meta App once (callback URL = the trigger's webhook URL, verify token =
//      the trigger's component ID) and subscribe to the `messages` field.
//   2. Signature verification (X-Hub-Signature-256) needs the Meta App secret.
//      When `context.config.clientSecret` is available it is used; otherwise the
//      signature step is skipped.

module.exports = {

    async start() {
        // Intentionally empty — webhook setup is operator-managed (see header).
    },

    async stop() {
        // Intentionally empty.
    },

    async receive(context) {

        if (!context.messages.webhook) return;

        const { body, headers, query, rawBody } = context.messages.webhook.content || {};

        // Verification handshake — Meta sends GET with hub.mode/challenge/verify_token
        if (query && query['hub.challenge']) {
            if (query['hub.verify_token'] !== context.componentId) {
                return context.response({ statusCode: 403 });
            }
            return context.response({ statusCode: 200, body: query['hub.challenge'] });
        }

        // Optional signature verification — relies on Appmixer exposing the
        // Meta App secret via context.config.clientSecret.
        const appSecret = context.config && context.config.clientSecret;
        const signature = headers && (headers['x-hub-signature-256'] || headers['X-Hub-Signature-256']);
        if (appSecret && signature && rawBody) {
            const ok = lib.verifyWebhookSignature({ rawBody, signatureHeader: signature, appSecret });
            if (!ok) {
                await context.log({ step: 'webhook-signature-mismatch' });
                return context.response({ statusCode: 401 });
            }
        }

        const { messages, wabaId, phoneNumberId } = lib.parseWebhookPayload(body);

        if (!messages.length) {
            return context.response({ statusCode: 200 });
        }

        for (const msg of messages) {
            await context.sendJson({
                ...msg,
                phoneNumberId,
                wabaId
            }, 'message');
        }

        return context.response({ statusCode: 200 });
    }
};
