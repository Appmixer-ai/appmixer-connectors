'use strict';

const crypto = require('crypto');
const lib = require('../../lib');

// The echo (job ID, hook, correlation ID) rides in the callback URL, not in component state:
// one component has one webhook URL for all its calls, and a callback can arrive before a
// state write after the submit would have committed.
const ECHO_PARAM = 'echo';

function buildCallbackUrl(context, echo) {

    const base = context.getWebhookUrl();
    const separator = base.indexOf('?') === -1 ? '?' : '&';
    return `${base}${separator}${ECHO_PARAM}=${encodeURIComponent(JSON.stringify(echo))}`;
}

function readEcho(context) {

    const raw = ((context.messages.webhook.content || {}).query || {})[ECHO_PARAM];
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
        return {};
    }
}

module.exports = {

    async receive(context) {

        // ── the gateway side reporting back ────────────────────────────
        if (context.messages.webhook) {

            const echo = readEcho(context);
            // Anything can POST to the webhook URL; only a call made with the URL this
            // component handed out carries a job ID.
            if (!echo.jobId) {
                await context.log({ step: 'ignored-callback', reason: 'no job ID in the callback URL' });
                return context.response({ ok: false, error: 'unknown job' }, 400);
            }

            const body = (context.messages.webhook.content || {}).data;
            const result = body && typeof body === 'object' && !Array.isArray(body) ? body : { value: body };
            // "final": false marks an update while the run goes on; anything else is the result
            const port = result.final === false ? 'progress' : 'done';
            try {
                await context.sendJson({
                    jobId: echo.jobId,
                    hook: echo.hook || '',
                    correlationId: echo.correlationId || '',
                    result
                }, port);
            } finally {
                // Acknowledge even if the emit threw: without a 2xx the sender retries, and the
                // retry re-runs whatever just failed.
                await context.response({ ok: true });
            }
            return;
        }

        // ── the call ───────────────────────────────────────────────────
        const { hook, payload, correlationId, idempotencyKey } = context.messages.in.content;

        if (!hook) {
            throw new context.CancelError('Hook is required!');
        }
        const name = lib.hookName(context, hook);

        const data = lib.parseJsonInput(context, payload, 'Payload') || {};
        if (typeof data !== 'object' || Array.isArray(data)) {
            throw new context.CancelError('Payload must be a JSON object.');
        }
        if (Object.prototype.hasOwnProperty.call(data, 'callbackUrl')) {
            throw new context.CancelError('Payload must not contain callbackUrl: Call Hook sets it to its own URL.');
        }

        const echo = { jobId: crypto.randomUUID(), hook: name, correlationId: correlationId ? String(correlationId) : '' };
        const { status, data: response } = await lib.postHook(
            context,
            `/${name}`,
            { ...data, callbackUrl: buildCallbackUrl(context, echo) },
            { idempotencyKey }
        );

        // 204: the mapping produced no action (its transform returned null), so nothing will
        // ever call back. Say so instead of waiting on Done forever.
        if (status === 204) {
            throw new context.CancelError(
                `Hook ${name} started nothing (HTTP 204): its mapping or transform turned the payload down, so no result will come back.`
            );
        }

        return context.sendJson({ ...echo, runId: (response && response.runId) || '' }, 'out');
    }
};
