'use strict';

const crypto = require('crypto');
const lib = require('../../lib');

// The echo (job ID, hook, correlation ID) rides in the callback URL, not in component state:
// one component has one webhook URL for all its calls, and a callback can arrive before a
// state write after the submit would have committed.
const ECHO_PARAM = 'echo';
// The echo is signed: an HMAC-SHA256 over the exact echo string with a per-component secret,
// so a caller who did not get the URL from this component cannot invent a job ID, hook or
// correlation ID and make Done or Progress fire.
const SIGNATURE_PARAM = 'sig';
const SECRET_KEY = 'callbackSecret';

function sign(secret, value) {

    return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * The component's callback secret, created once (in start(), or on the first call of a
 * component started before the secret existed) and kept in component state.
 */
async function getSecret(context) {

    const existing = await context.stateGet(SECRET_KEY);
    if (existing) return existing;

    let lock;
    try {
        lock = await context.lock(`openclaw-callhook-secret-${context.componentId}`);
        const current = await context.stateGet(SECRET_KEY);
        if (current) return current;
        const secret = crypto.randomBytes(32).toString('hex');
        await context.stateSet(SECRET_KEY, secret);
        return secret;
    } finally {
        if (lock) await lock.unlock();
    }
}

function buildCallbackUrl(context, echo, secret) {

    const base = context.getWebhookUrl();
    const separator = base.indexOf('?') === -1 ? '?' : '&';
    const raw = JSON.stringify(echo);
    return `${base}${separator}${ECHO_PARAM}=${encodeURIComponent(raw)}&${SIGNATURE_PARAM}=${sign(secret, raw)}`;
}

function signatureMatches(secret, raw, signature) {

    if (typeof signature !== 'string' || !/^[0-9a-f]{64}$/.test(signature)) return false;
    const expected = Buffer.from(sign(secret, raw), 'hex');
    const actual = Buffer.from(signature, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/**
 * The echo of a callback, or null when it is missing, malformed or not signed by this component.
 */
function readEcho(context, secret) {

    const query = (context.messages.webhook.content || {}).query || {};
    const raw = query[ECHO_PARAM];
    if (!secret || typeof raw !== 'string' || !raw) return null;
    if (!signatureMatches(secret, raw, query[SIGNATURE_PARAM])) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        return null;
    }
}

module.exports = {

    async start(context) {

        await getSecret(context);
    },

    async receive(context) {

        // ── the gateway side reporting back ────────────────────────────
        if (context.messages.webhook) {

            // Anything can POST to the webhook URL; only the URL this component handed out
            // carries an echo with a valid signature. Read the secret without creating one: if
            // there is none, no URL was ever handed out.
            const secret = await context.stateGet(SECRET_KEY);
            const echo = readEcho(context, secret);
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

        const secret = await getSecret(context);
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
