'use strict';

const lib = require('../../lib');

// See NewMessage.js for the webhook-setup notes — same constraints apply.

module.exports = {

    async start() {},

    async stop() {},

    async receive(context) {

        if (!context.messages.webhook) return;

        const { body, headers, query, rawBody } = context.messages.webhook.content || {};

        if (query && query['hub.challenge']) {
            if (query['hub.verify_token'] !== context.componentId) {
                return context.response({ statusCode: 403 });
            }
            return context.response({ statusCode: 200, body: query['hub.challenge'] });
        }

        const appSecret = context.config && context.config.clientSecret;
        const signature = headers && (headers['x-hub-signature-256'] || headers['X-Hub-Signature-256']);
        if (appSecret && signature && rawBody) {
            const ok = lib.verifyWebhookSignature({ rawBody, signatureHeader: signature, appSecret });
            if (!ok) {
                await context.log({ step: 'webhook-signature-mismatch' });
                return context.response({ statusCode: 401 });
            }
        }

        const { statuses, wabaId, phoneNumberId } = lib.parseWebhookPayload(body);

        if (!statuses.length) {
            return context.response({ statusCode: 200 });
        }

        for (const status of statuses) {
            await context.sendJson({
                id: status.id,
                recipientId: status.recipient_id,
                status: status.status,
                timestamp: status.timestamp,
                conversation: status.conversation,
                errors: status.errors,
                phoneNumberId,
                wabaId
            }, 'status');
        }

        return context.response({ statusCode: 200 });
    }
};
