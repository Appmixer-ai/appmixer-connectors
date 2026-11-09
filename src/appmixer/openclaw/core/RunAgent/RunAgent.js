'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            message,
            agentId,
            sessionKey,
            name,
            model,
            thinking,
            timeoutSeconds,
            announce,
            channel,
            to,
            accountId,
            idempotencyKey
        } = context.messages.in.content;

        if (!message || !String(message).trim()) {
            throw new context.CancelError('Message is required!');
        }

        const body = { message: String(message) };
        if (agentId) body.agentId = String(agentId);
        // A key continues one conversation: the gateway creates the session on the first run
        // with it and reuses it after. Without one every run gets a fresh, isolated session.
        const key = sessionKey ? String(sessionKey).trim() : '';
        if (key) {
            body.sessionKey = key;
            body.sessionMode = 'persistent';
        }
        if (name) body.name = String(name);
        if (model) body.model = String(model);
        if (thinking) body.thinking = String(thinking);
        if (timeoutSeconds !== undefined && timeoutSeconds !== null && timeoutSeconds !== '') {
            const seconds = Number(timeoutSeconds);
            if (!Number.isFinite(seconds) || seconds < 1) {
                throw new context.CancelError('Timeout (seconds) must be a positive number.');
            }
            body.timeoutSeconds = Math.floor(seconds);
        }

        // The gateway announces by default; a flow run only does when asked to. A direct
        // destination needs both Channel and To, which the gateway would answer with a 400.
        body.deliver = announce === true;
        if (body.deliver && (channel || to || accountId)) {
            if (!channel || !to) {
                throw new context.CancelError('Announce Result to a channel needs both Channel and To.');
            }
            body.channel = String(channel);
            body.to = String(to);
            if (accountId) body.accountId = String(accountId);
        }

        const { data } = await lib.postHook(context, '/agent', body, { idempotencyKey });

        if (!data || !data.runId) {
            throw new context.CancelError('The gateway accepted the request but returned no run ID.');
        }

        return context.sendJson({ runId: data.runId, sessionKey: key }, 'out');
    }
};
