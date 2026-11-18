'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_ORIGIN = 'https://api.track.toggl.com';
const API_BASE_URL = `${API_ORIGIN}/api/v9`;
const REPORTS_BASE_URL = `${API_ORIGIN}/reports/api/v3`;
const WEBHOOKS_BASE_URL = `${API_ORIGIN}/webhooks/api/v1`;

const DEFAULT_PREFIX = 'toggl-objects-export';
const CREATED_WITH = 'Appmixer';

// GET /me counts against the user-specific quota of 30 requests per hour, so the default
// workspace it returns is cached.
const DEFAULT_WORKSPACE_TTL = 10 * 60 * 1000;

// A webhook subscription is pinged at most this many times while it waits for validation.
const MAX_VALIDATION_PINGS = 10;
const VALIDATION_CHECK_INTERVAL = 60 * 1000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

const authHeaders = (apiToken) => {

    const encoded = Buffer.from(`${apiToken}:api_token`).toString('base64');
    return { 'Authorization': `Basic ${encoded}` };
};

/**
 * context.httpRequest with the Toggl credential, a retry on 429 (leaky bucket, Toggl asks
 * to back off) and a readable error for 402 (hourly quota used up, or a paid feature).
 */
const request = async (context, options, { maxRetries = 2 } = {}) => {

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await context.httpRequest({
                ...options,
                headers: {
                    ...(options.headers || {}),
                    ...authHeaders(context.auth.apiToken)
                }
            });
        } catch (err) {
            const status = err.response && err.response.status;
            if (status === 429 && attempt < maxRetries) {
                const headers = err.response.headers || {};
                const retryAfter = parseInt(headers['retry-after'], 10);
                const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000 * Math.pow(2, attempt);
                await context.log({ step: 'rate-limited', status, attempt, waitMs });
                await sleep(Math.min(waitMs, 15000));
                attempt += 1;
                continue;
            }
            if (status === 402) {
                const headers = err.response.headers || {};
                const resetsIn = headers['x-toggl-quota-resets-in'];
                const body = err.response.data;
                const detail = typeof body === 'string' ? body : JSON.stringify(body || '');
                throw new context.CancelError(
                    'Toggl Track refused the request with 402: the hourly API quota of the organization is used up' +
                    (resetsIn ? ` (resets in ${resetsIn} s)` : '') +
                    ', or the feature needs a paid plan. ' + detail
                );
            }
            throw err;
        }
    }
};

/**
 * Toggl IDs are numeric. Checking them before they go into a URL path keeps user input
 * from changing the path.
 */
const requireId = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(`${label} is required!`);
    }
    const text = String(value).trim();
    if (!/^\d+$/.test(text)) {
        throw new context.CancelError(`${label} must be a numeric Toggl ID, got "${value}".`);
    }
    return text;
};

const optionalId = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    return Number(requireId(context, value, label));
};

/**
 * The workspace the user picked, or the account's default workspace (GET /me, cached).
 */
const resolveWorkspaceId = async (context, workspaceId) => {

    if (workspaceId !== undefined && workspaceId !== null && workspaceId !== '') {
        return requireId(context, workspaceId, 'Workspace');
    }

    const key = `toggl-default-workspace-${hash({ token: context.auth.apiToken })}`;
    const cached = await context.staticCache.get(key);
    if (cached) {
        return String(cached);
    }
    const { data } = await request(context, { method: 'GET', url: `${API_BASE_URL}/me` });
    if (!data || !data.default_workspace_id) {
        throw new context.CancelError('Workspace is required: the account has no default workspace.');
    }
    await context.staticCache.set(key, data.default_workspace_id, DEFAULT_WORKSPACE_TTL);
    return String(data.default_workspace_id);
};

/**
 * Toggl expects RFC 3339 times in UTC without fractions: 2006-01-02T15:04:05Z.
 */
const toTogglTime = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new context.CancelError(`${label} is not a valid date: ${value}`);
    }
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

/**
 * Calendar date (YYYY-MM-DD) for the Reports API. A value that already is a date is kept as
 * typed, so no time zone shifts it to another day.
 */
const toDateOnly = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return String(value);
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new context.CancelError(`${label} is not a valid date: ${value}`);
    }
    return date.toISOString().slice(0, 10);
};

/**
 * A text input that takes a comma-separated list (tag names, IDs), or an array from a variable.
 */
const splitList = (value) => {

    if (value === undefined || value === null || value === '') {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(item => item.length > 0);
    }
    return String(value).split(',').map(item => item.trim()).filter(item => item.length > 0);
};

const idList = (context, value, label) => splitList(value).map(item => Number(requireId(context, item, label)));

/**
 * Cached GET for inspector sources: the designer calls them in bursts when an inspector opens.
 */
const getCached = async (context, url, params) => {

    let lock;
    try {
        const key = `toggl-source-${hash({ url, params, token: context.auth.apiToken })}`;
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const { data } = await request(context, { method: 'GET', url, params });
        await context.staticCache.set(key, data, context.config.listCacheTTL || (2 * 60 * 1000));
        return data;
    } finally {
        lock?.unlock();
    }
};

/**
 * GET /me/time_entries - without parameters it lists the latest entries, with
 * start_date/end_date the entries that start in that range.
 */
const listMyTimeEntries = async (context, params = {}) => {

    const { data } = await request(context, {
        method: 'GET',
        url: `${API_BASE_URL}/me/time_entries`,
        params
    });
    return Array.isArray(data) ? data : [];
};

const byDateDesc = field => (a, b) => String(b[field] || '').localeCompare(String(a[field] || ''));

const isSameToken = (received, expected) => {

    if (typeof received !== 'string' || typeof expected !== 'string') {
        return false;
    }
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * Webhook triggers (Webhooks API v1). One subscription per trigger, created when the flow
 * starts and deleted when it stops.
 *
 * Toggl signs events with X-Webhook-Signature-256 (HMAC of the raw body). A component only
 * receives the parsed body, so that HMAC cannot be checked byte-exactly; a random token in the
 * callback URL, checked on every delivery, proves the request comes from the subscription.
 */
const webhooks = {

    async start(context, { eventFilters, label }) {

        const workspaceId = await resolveWorkspaceId(context, context.properties.workspaceId);
        const token = crypto.randomBytes(24).toString('hex');
        const webhookUrl = context.getWebhookUrl();
        const separator = webhookUrl.indexOf('?') === -1 ? '?' : '&';

        // The validation PING can arrive before the create call returns: the token must be
        // in the state already.
        await context.saveState({ token, workspaceId });

        const { data } = await request(context, {
            method: 'POST',
            url: `${WEBHOOKS_BASE_URL}/subscriptions/${workspaceId}`,
            data: {
                url_callback: `${webhookUrl}${separator}token=${token}`,
                event_filters: eventFilters,
                enabled: true,
                // Must be unique in the workspace.
                description: `Appmixer ${label} ${context.flowId}:${context.componentId}`
            }
        });

        await context.stateSet('subscriptionId', data.subscription_id);
        if (data.validated_at) {
            await context.stateSet('validated', true);
        }
    },

    async stop(context) {

        const { workspaceId, subscriptionId } = await context.loadState();
        if (!workspaceId || !subscriptionId) {
            return;
        }
        try {
            await request(context, {
                method: 'DELETE',
                url: `${WEBHOOKS_BASE_URL}/subscriptions/${workspaceId}/${subscriptionId}`
            });
        } catch (err) {
            const status = err.response && err.response.status;
            if (status !== 404) {
                throw err;
            }
        }
    },

    /**
     * A subscription receives events only once it is validated. receive() answers the PING
     * with the validation code; tick() checks the subscription and pings it again until it is
     * validated (the first PING can arrive before the flow accepts webhooks).
     */
    async tick(context) {

        const state = await context.loadState();
        const { workspaceId, subscriptionId } = state;
        if (!workspaceId || !subscriptionId || state.validated) {
            return;
        }
        const pings = state.pings || 0;
        const checkedRecently = state.lastCheck && Date.now() - state.lastCheck < VALIDATION_CHECK_INTERVAL;
        if (pings >= MAX_VALIDATION_PINGS || checkedRecently) {
            return;
        }

        try {
            const { data } = await request(context, {
                method: 'GET',
                url: `${WEBHOOKS_BASE_URL}/subscriptions/${workspaceId}`
            });
            const subscription = (Array.isArray(data) ? data : [])
                .find(item => String(item.subscription_id) === String(subscriptionId));
            if (subscription && subscription.validated_at) {
                await context.stateSet('validated', true);
                return;
            }
            await context.stateSet('lastCheck', Date.now());
            await context.stateSet('pings', pings + 1);
            await request(context, {
                method: 'POST',
                url: `${WEBHOOKS_BASE_URL}/ping/${workspaceId}/${subscriptionId}`
            });
        } catch (err) {
            await context.log({ step: 'webhook-validation-check-failed', error: err.message });
        }
    },

    /**
     * Handle a delivery: the validation PING, or an entity event whose `payload` is emitted.
     */
    async receive(context, { model, action }) {

        const webhook = context.messages.webhook;
        if (!webhook) {
            return;
        }

        const state = await context.loadState();
        const received = webhook.content && webhook.content.query && webhook.content.query.token;
        if (!isSameToken(received, state.token)) {
            await context.log({ step: 'webhook-rejected', reason: 'Missing or invalid token in the callback URL.' });
            return context.response({ error: 'Forbidden' }, 403);
        }

        const event = (webhook.content && webhook.content.data) || {};
        if (state.subscriptionId && event.subscription_id
            && String(event.subscription_id) !== String(state.subscriptionId)) {
            return context.response();
        }

        const validationCode = event.validation_code
            || (event.payload && typeof event.payload === 'object' && event.payload.validation_code);
        if (validationCode) {
            if (state.workspaceId && state.subscriptionId) {
                // Asynchronous validation, in case the response body below is not read.
                try {
                    await context.httpRequest({
                        method: 'GET',
                        url: `${WEBHOOKS_BASE_URL}/validate/${state.workspaceId}/${state.subscriptionId}/` +
                            encodeURIComponent(validationCode)
                    });
                } catch (err) {
                    await context.log({ step: 'webhook-validate-call', error: err.message });
                }
                await context.stateSet('validated', true);
            }
            // Synchronous validation: Toggl reads {"validation_code": "..."} from the response.
            return context.response({ validation_code: validationCode }, 200, { 'Content-Type': 'application/json' });
        }

        const payload = event.payload;
        if (!payload || typeof payload !== 'object') {
            // A PING without a validation code, or an event without an entity.
            return context.response();
        }

        const metadata = event.metadata || {};
        if ((model && metadata.model && metadata.model !== model)
            || (action && metadata.action && metadata.action !== action)) {
            return context.response();
        }

        if (event.event_id !== undefined && event.event_id !== null) {
            let lock;
            try {
                lock = await context.lock(`toggl-webhook-${context.componentId}`, {
                    ttl: 1000 * 10,
                    retryDelay: 500,
                    maxRetryCount: 3
                });
                // Toggl retries a delivery that was not acknowledged: emit each event once.
                const cacheKey = `toggl-webhook-event-${context.componentId}-${event.event_id}`;
                if (await context.staticCache.get(cacheKey)) {
                    return context.response();
                }
                await context.staticCache.set(cacheKey, true, 60 * 60 * 1000);
            } finally {
                await lock?.unlock();
            }
        }

        await context.sendJson(payload, 'out');
        return context.response();
    }
};

module.exports = {

    API_ORIGIN,
    API_BASE_URL,
    REPORTS_BASE_URL,
    WEBHOOKS_BASE_URL,
    CREATED_WITH,

    authHeaders,
    request,
    requireId,
    optionalId,
    resolveWorkspaceId,
    toTogglTime,
    toDateOnly,
    splitList,
    idList,
    getCached,
    listMyTimeEntries,
    byDateDesc,
    webhooks,

    /**
     * Resolve a MakeApiCall URL. A relative path is resolved against the Track API v9
     * (https://api.track.toggl.com/api/v9); a full URL is accepted only on
     * https://api.track.toggl.com (Track, Reports and Webhooks APIs), so the API token is never
     * sent to another host.
     */
    resolveApiUrl(context, url) {

        const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
        const candidate = isAbsolute ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== API_ORIGIN) {
            throw new context.CancelError(`API Endpoint Path must target ${API_ORIGIN}, got ${parsed.origin}.`);
        }

        return parsed.toString();
    },

    /**
     * Parse a textarea JSON input. Empty input means "no body"; an object is passed through.
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
     * Convert a key-value inspector input into a plain object. The Designer stores the rows as
     * the JSON string of an object; a plain object and an array of {key, value} rows (also as a
     * JSON string) are accepted too, for values mapped from a variable.
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
    },

    async sendArrayOutput({
        context,
        outputPortName = 'out',
        outputType = 'array',
        records = []
    }) {

        if (outputType === 'first') {
            if (records.length === 0) {
                throw new context.CancelError('No records available for first output type');
            }
            await context.sendJson(
                { ...records[0], index: 0, count: records.length },
                outputPortName
            );
        } else if (outputType === 'object') {
            for (let index = 0; index < records.length; index++) {
                await context.sendJson(
                    { ...records[index], index, count: records.length },
                    outputPortName
                );
            }
        } else if (outputType === 'array') {
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {
            const csvString = toCsv(records);
            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    getOutputPortOptions(context, outputType, itemSchema, { label }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: fieldLabel, ...schemaWithoutTitle } = schema;
                    res.push({ label: fieldLabel, value: field, schema: schemaWithoutTitle });
                    return res;
                }, [{
                    label: 'Current Item Index',
                    value: 'index',
                    schema: { type: 'integer' }
                }, {
                    label: 'Items Count',
                    value: 'count',
                    schema: { type: 'integer' }
                }]);
            return context.sendJson(options, 'out');
        }

        if (outputType === 'array') {
            return context.sendJson([{
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }, {
                label,
                value: 'result',
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with
    // a different key order or a missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};
