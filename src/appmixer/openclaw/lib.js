'use strict';

const DEFAULT_HOOKS_PATH = '/hooks';
// One path segment of the hooks prefix, or a mapped hook's name: no slash, no dot-only segment
const SEGMENT = /^[A-Za-z0-9_~-][A-Za-z0-9._~-]*$/;

/**
 * A CancelError when a component context is at hand (a bad input or account value does not
 * get better on retry), a plain Error in auth.js.
 * @param {object} [context]
 * @param {string} message
 */
function failure(context, message) {

    return context && context.CancelError ? new context.CancelError(message) : new Error(message);
}

/**
 * The first line of a gateway error response: `{ ok: false, error }` JSON, or plain text
 * for early method/auth/path failures.
 * @param {object} error error thrown by context.httpRequest
 * @returns {string}
 */
function gatewayErrorText(error) {

    const data = error.response && error.response.data;
    if (data && typeof data === 'object') {
        return String(data.error || data.message || JSON.stringify(data)).slice(0, 500);
    }
    return String(data || error.message || '').split('\n')[0].slice(0, 500);
}

module.exports = {

    DEFAULT_HOOKS_PATH,

    /**
     * The origin of the gateway the account points at. The account's hook token is sent to
     * it, so it must be an https URL with no credentials in it; any path, query or fragment
     * typed into the field is dropped.
     * @param {string} value the Gateway URL account field
     * @param {object} [context] component context, for CancelError
     * @returns {string} e.g. https://openclaw.example.com
     */
    gatewayOrigin(value, context) {

        let parsed;
        try {
            parsed = new URL(String(value || '').trim());
        } catch (error) {
            throw failure(context, `Gateway URL is not a valid URL: ${value}`);
        }
        if (parsed.protocol !== 'https:') {
            throw failure(context, 'Gateway URL must use https: the hook token travels with every request.');
        }
        if (parsed.username || parsed.password) {
            throw failure(context, 'Gateway URL must not contain credentials.');
        }
        return parsed.origin;
    },

    /**
     * The hooks prefix of the gateway (`hooks.path` in its config), `/hooks` when empty.
     * @param {string} value the Hooks Path account field
     * @param {object} [context] component context, for CancelError
     * @returns {string} e.g. /hooks
     */
    hooksPath(value, context) {

        const trimmed = String(value || '').trim().replace(/\/+$/, '');
        if (!trimmed) {
            return DEFAULT_HOOKS_PATH;
        }
        const segments = trimmed.replace(/^\//, '').split('/');
        if (!segments.every(segment => SEGMENT.test(segment))) {
            throw failure(context, `Hooks Path must be a plain path such as /hooks, got ${value}.`);
        }
        return '/' + segments.join('/');
    },

    /**
     * The URL every hook lives under: the gateway origin plus the hooks prefix.
     * @param {object} auth the account (context.auth in a component, the context in auth.js)
     * @param {object} [context] component context, for CancelError
     * @returns {string} e.g. https://openclaw.example.com/hooks
     */
    hooksBaseUrl(auth, context) {

        const origin = module.exports.gatewayOrigin(auth.gatewayUrl, context);
        return origin + module.exports.hooksPath(auth.hooksPath, context);
    },

    /**
     * A mapped hook's name, as the last path segment: letters, digits, dot, dash, underscore.
     * @param {object} context component context
     * @param {string} name
     * @returns {string}
     */
    hookName(context, name) {

        const trimmed = String(name || '').trim().replace(/^\/+/, '');
        if (!SEGMENT.test(trimmed)) {
            throw new context.CancelError(
                `Hook must be the name of a mapped hook such as github-issue (letters, digits, ".", "-", "_"), got ${name}.`
            );
        }
        return trimmed;
    },

    /**
     * The one place that turns the account into request headers.
     * @param {object} auth the account (context.auth in a component, the context in auth.js)
     * @returns {object}
     */
    authHeaders(auth) {

        return { 'Authorization': `Bearer ${auth.token}` };
    },

    /**
     * POST a JSON body to a path under the hooks prefix. Gateway answers that a retry cannot
     * fix (bad token, no such hook, invalid payload, body too large) become a CancelError with
     * the gateway's own reason; throttling, admission timeouts and outages are rethrown so
     * the engine retries them.
     * @param {object} context component context
     * @param {string} path e.g. /agent or /github-issue
     * @param {object} data JSON body
     * @param {object} [options]
     * @param {string} [options.idempotencyKey] replay key for agent admission
     * @returns {Promise<{ status: number, data: any }>}
     */
    async postHook(context, path, data, { idempotencyKey } = {}) {

        const url = module.exports.hooksBaseUrl(context.auth, context) + path;
        const headers = module.exports.authHeaders(context.auth);
        if (idempotencyKey) {
            headers['Idempotency-Key'] = String(idempotencyKey);
        }
        try {
            const response = await context.httpRequest({ method: 'POST', url, headers, data });
            return { status: response.status, data: response.data };
        } catch (error) {
            const status = error.response && error.response.status;
            const reason = gatewayErrorText(error);
            if (status === 401) {
                throw new context.CancelError(`The gateway rejected the hook token (HTTP 401) at ${url}. Reconnect the account with the current hooks.token.`);
            }
            if (status === 403 || status === 404) {
                throw new context.CancelError(
                    // eslint-disable-next-line max-len
                    `No hook at ${url} (HTTP ${status}). Check that hooks are enabled, that a mapping matches this path, and that a reverse proxy forwards it.`
                );
            }
            if (status === 400 || status === 409 || status === 413) {
                throw new context.CancelError(`The gateway refused the request (HTTP ${status}): ${reason}`);
            }
            if (status === 500) {
                throw new context.CancelError(`The hook's mapping or transform failed on the gateway (HTTP 500): ${reason}`);
            }
            throw new Error(status ? `OpenClaw gateway answered HTTP ${status}: ${reason}` : `OpenClaw gateway unreachable: ${error.message}`);
        }
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the gateway
     * origin and refuse anything that would send the hook token somewhere else.
     *
     * Resolving through the WHATWG URL parser and comparing the resulting origin also rejects
     * protocol-relative input such as `//example.com/x`, which would otherwise silently resolve
     * to a foreign host.
     * @param {object} context Appmixer component context
     * @param {string} url relative path (e.g. '/hooks/agent') or absolute URL on the gateway
     * @returns {string} absolute URL on the gateway
     */
    resolveApiUrl(context, url) {

        const origin = module.exports.gatewayOrigin(context.auth.gatewayUrl, context);
        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
            ? url
            : `${url.startsWith('/') ? '' : '/'}${url}`;

        let parsed;
        try {
            parsed = new URL(candidate, origin);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== origin) {
            throw new context.CancelError(`API Endpoint Path must target ${origin}, got ${parsed.origin}.`);
        }

        return parsed.toString();
    },

    /**
     * Parse a textarea JSON input. Empty input means "no body"; an object is passed through
     * (the designer may already have parsed a variable).
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string|object} value raw input
     * @param {string} label human readable input name for the error message
     * @returns {object|undefined}
     */
    parseJsonInput(context, value, label) {

        if (value === null || value === undefined || value === '') {
            return undefined;
        }

        if (typeof value === 'object') {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            throw new context.CancelError(`${label} must be valid JSON.`);
        }
    },

    /**
     * Convert a key-value inspector input into a plain object.
     * The Designer stores the rows as the JSON string of an object
     * ('{"Accept":"application/json"}'). A plain object and an array of
     * {key, value} rows (also as a JSON string) are accepted too, for values
     * mapped from a variable. Accepting only the array form silently drops
     * every header and query parameter the user set.
     * @param {string|object|Array<{key: string, value: *}>} value
     * @returns {object}
     */
    kvToObject(value) {

        let input = value;
        if (typeof input === 'string') {
            if (!input.trim()) {
                return {};
            }
            try {
                input = JSON.parse(input);
            } catch (error) {
                throw new Error('Request Headers and Query Parameters must be a JSON object of key-value pairs.');
            }
        }
        if (!input || typeof input !== 'object') {
            return {};
        }
        const entries = Array.isArray(input)
            ? input.filter(row => row && typeof row === 'object').map(row => [row.key, row.value])
            : Object.entries(input);
        const result = {};
        for (const [key, val] of entries) {
            if (typeof key !== 'string' || !key) {
                continue;
            }
            result[key] = val;
        }
        return result;
    }
};
