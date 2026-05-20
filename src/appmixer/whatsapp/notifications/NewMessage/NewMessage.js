'use strict';

const lib = require('../../lib');

const SUBSCRIBED_FIELDS = ['messages'];

module.exports = {

    async start(context) {

        // Auto-subscribe the webhook on the Meta App level when appId+appSecret are configured.
        // Otherwise the user is expected to set up the webhook manually in the Meta App Dashboard
        // (callback URL = the trigger URL, verify token = the trigger's component ID).
        const { appId, appSecret } = context.auth || {};
        if (!appId || !appSecret) {
            await context.log({ step: 'webhook-setup-required', message: 'Set the webhook URL and verify token manually in Meta App Dashboard. App ID/Secret not provided so auto-subscribe was skipped.' });
            return;
        }

        try {
            await lib.subscribeAppWebhook(context, {
                callbackUrl: context.getWebhookUrl(),
                verifyToken: context.componentId,
                fields: SUBSCRIBED_FIELDS
            });
        } catch (err) {
            throw new context.CancelError('Failed to subscribe webhook on Meta App: ' + (err.message || err));
        }
    },

    async stop(context) {

        const { appId, appSecret } = context.auth || {};
        if (!appId || !appSecret) return;

        try {
            await lib.unsubscribeAppWebhook(context);
        } catch (err) {
            // best-effort
            await context.log({ step: 'webhook-unsubscribe-failed', message: err.message || String(err) });
        }
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

        // Signature verification (optional but recommended)
        const appSecret = context.auth && context.auth.appSecret;
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
