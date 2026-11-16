'use strict';

const crypto = require('crypto');
const lib = require('../../lib');

// The echo (job ID, hook, correlation ID) rides in the callback URL, not in component state:
// one component has one webhook URL for all its calls, and a callback can arrive before a
// state write after the submit would have committed.
const ECHO_PARAM = 'echo';
// The echo is signed: an HMAC-SHA256 over the exact echo string, so a caller who did not get the
// URL from this component cannot invent a job ID, hook or correlation ID and make Done or Progress
// fire. The key is derived from the account's hook token and the component ID, not kept in
// component state: stopping a flow wipes its state, so a key kept there turned every callback
// still on its way into a 403 after a restart (and a restart while a run goes on is normal).
const SIGNATURE_PARAM = 'sig';
// 1.0.1 kept a random key in component state; URLs it handed out stay valid while that state
// lasts. The key is only read, never created.
const LEGACY_SECRET_KEY = 'callbackSecret';

function sign(secret, value) {

    return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * The signing key of this component: unknown without the hook token, stable across flow
 * restarts. Rotating the hook token invalidates the callback URLs handed out before.
 */
function deriveSecret(context) {

    const token = (context.auth || {}).token;
    return token ? sign(token, `appmixer.openclaw.CallHook:${context.componentId}`) : null;
}

function buildCallbackUrl(context, echo, secret) {

    const base = context.getWebhookUrl();
    const separator = base.indexOf('?') === -1 ? '?' : '&';
    const raw = JSON.stringify(echo);
    return `${base}${separator}${ECHO_PARAM}=${encodeURIComponent(raw)}&${SIGNATURE_PARAM}=${sign(secret, raw)}`;
}

function signatureMatches(secret, raw, signature) {

    if (!secret || typeof signature !== 'string' || !/^[0-9a-f]{64}$/.test(signature)) return false;
    const expected = Buffer.from(sign(secret, raw), 'hex');
    const actual = Buffer.from(signature, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/**
 * The echo of a callback, or null when it is missing, malformed or not signed by this component.
 */
async function readEcho(context) {

    const query = (context.messages.webhook.content || {}).query || {};
    const raw = query[ECHO_PARAM];
    const signature = query[SIGNATURE_PARAM];
    if (typeof raw !== 'string' || !raw) return null;
    if (!signatureMatches(deriveSecret(context), raw, signature)
        && !signatureMatches(await context.stateGet(LEGACY_SECRET_KEY), raw, signature)) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        return null;
    }
}

module.exports = {

    async receive(context) {

        // ── the gateway side reporting back ────────────────────────────
        if (context.messages.webhook) {

            // Anything can POST to the webhook URL; only the URL this component handed out
            // carries an echo with a valid signature.
            const echo = await readEcho(context);
            if (!echo || !echo.jobId) {
                await context.log({ step: 'ignored-callback', reason: 'missing or invalid signature of the callback URL' });
                return context.response({ ok: false, error: 'unknown job' }, 403);
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

        const secret = deriveSecret(context);
        if (!secret) {
            throw new context.CancelError('The account has no hook token: reconnect the OpenClaw account.');
        }
        const echo = { jobId: crypto.randomUUID(), hook: name, correlationId: correlationId ? String(correlationId) : '' };
        const { status, data: response } = await lib.postHook(
            context,
            `/${name}`,
            { ...data, callbackUrl: buildCallbackUrl(context, echo, secret) },
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
