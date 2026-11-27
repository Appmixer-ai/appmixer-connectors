'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Gorgias REST API: https://developers.gorgias.com/llms.txt
// Every account has its own host, https://{subdomain}.gorgias.com, and the API lives under /api.
// Requests authenticate with HTTP Basic auth: the user's login email and a REST API key.
// https://developers.gorgias.com/docs/access-tokens-api-keys

// A plain subdomain only. The subdomain becomes the request host and the API key is sent to it,
// so "evil.example/x?" must never reach a URL. Checked as typed, not normalized: components
// build their URLs from the stored context.auth.subdomain.
const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

// Largest page of the list endpoints (limit: 1-100).
const PAGE_SIZE = 100;

// Inspector pickers are called in bursts when an inspector opens.
const DEFAULT_LIST_CACHE_TTL = 2 * 60 * 1000;

const DEFAULT_PREFIX = 'gorgias-objects-export';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

/**
 * The origin of the account's Gorgias host. Throws before any request when the subdomain is not
 * a plain subdomain.
 * @param {string} subdomain
 * @returns {string} e.g. https://acme.gorgias.com
 */
const apiOrigin = (subdomain) => {

    if (typeof subdomain !== 'string' || !SUBDOMAIN_PATTERN.test(subdomain)) {
        throw new Error(
            'Invalid Gorgias subdomain. Enter the subdomain only, e.g. "acme" for https://acme.gorgias.com.'
        );
    }
    return `https://${subdomain}.gorgias.com`;
};

/**
 * Basic auth header: the login email of the user who created the API key, and the key.
 * @param {{username: string, apiKey: string}} auth
 * @returns {object}
 */
const authHeaders = (auth) => {

    const username = String((auth && auth.username) || '').trim();
    const apiKey = String((auth && auth.apiKey) || '').trim();
    const token = Buffer.from(`${username}:${apiKey}`).toString('base64');
    return { 'Authorization': `Basic ${token}` };
};

/**
 * The origin of the connected account, as a CancelError when the stored subdomain is invalid.
 */
const accountOrigin = (context) => {

    try {
        return apiOrigin(context.auth && context.auth.subdomain);
    } catch (err) {
        throw new context.CancelError(err.message);
    }
};

/**
 * context.httpRequest against the account's Gorgias API with the credential, and a retry on 429
 * (Gorgias rate limits with a leaky bucket and answers 429 with a Retry-after header).
 * @param {object} context
 * @param {{method?: string, path?: string, url?: string, params?: object, data?: *, headers?: object}} options
 *   path is relative to /api (e.g. '/tickets'); url is an absolute URL on the account's host.
 */
const request = async (context, options, { maxRetries = 2 } = {}) => {

    const { path, url, headers = {}, ...rest } = options;
    const target = url || `${accountOrigin(context)}/api${path}`;

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await context.httpRequest({
                method: 'GET',
                ...rest,
                url: target,
                headers: { ...headers, ...authHeaders(context.auth) }
            });
        } catch (err) {
            const status = err.response && err.response.status;
            if (status === 429 && attempt < maxRetries) {
                const responseHeaders = err.response.headers || {};
                const retryAfter = parseInt(responseHeaders['retry-after'], 10);
                const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000 * Math.pow(2, attempt);
                await context.log({ step: 'rate-limited', status, attempt, waitMs });
                await sleep(Math.min(waitMs, 20000));
                attempt += 1;
                continue;
            }
            throw err;
        }
    }
};

/**
 * Gorgias IDs are integers. Checking them before they go into a URL path keeps user input from
 * changing the path.
 */
const requireId = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(`${label} is required!`);
    }
    const text = String(value).trim();
    if (!/^\d+$/.test(text)) {
        throw new context.CancelError(`${label} must be a numeric Gorgias ID, got "${value}".`);
    }
    return Number(text);
};

const optionalId = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    return requireId(context, value, label);
};

/**
 * Items of a list response: Gorgias wraps lists in { data, meta }.
 */
const listItems = (data) => {

    if (Array.isArray(data)) {
        return data;
    }
    return data && Array.isArray(data.data) ? data.data : [];
};

/**
 * One page (up to 100 items) of a list endpoint.
 * @returns {Promise<{items: object[], nextCursor: string|null}>}
 */
const listPage = async (context, path, params = {}) => {

    const { data } = await request(context, { method: 'GET', path, params: { limit: PAGE_SIZE, ...params } });
    const meta = (data && data.meta) || {};
    return { items: listItems(data), nextCursor: meta.next_cursor || null };
};

/**
 * listPage for inspector sources: cached per account, endpoint and query, behind a lock so a
 * burst of designer calls makes one request.
 */
const listPageCached = async (context, path, params = {}) => {

    const key = 'gorgias-source-' + hash({
        subdomain: context.auth.subdomain,
        username: context.auth.username,
        apiKey: context.auth.apiKey,
        path,
        params
    });
    let lock;
    try {
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const page = await listPage(context, path, params);
        await context.staticCache.set(key, page, context.config.listCacheTTL || DEFAULT_LIST_CACHE_TTL);
        return page;
    } finally {
        if (lock) {
            await lock.unlock();
        }
    }
};

/**
 * Normalize a multiselect input (array or string) to an array. Strings are a single value or a
 * comma-separated list (the value of a variable).
 */
const normalizeMultiselectInput = (input, context, fieldName) => {

    if (Array.isArray(input)) {
        return input.map(item => String(item).trim()).filter(item => item.length > 0);
    } else if (typeof input === 'string') {
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else {
        throw new context.CancelError(`${fieldName} must be a string or an array`);
    }
};

/**
 * Drop undefined values (and empty strings) so PUT bodies only carry what the user set.
 */
const compact = (object) => {

    const result = {};
    for (const [key, value] of Object.entries(object)) {
        if (value !== undefined && value !== '') {
            result[key] = value;
        }
    }
    return result;
};

// Tickets -----------------------------------------------------------------------------------

const getTicket = async (context, ticketId) => {

    const { data } = await request(context, { method: 'GET', path: `/tickets/${ticketId}` });
    return data;
};

/**
 * Newest ticket, read in full - the same shape the ticket webhook triggers emit.
 * @param {'created_datetime'|'updated_datetime'} orderField
 */
const fetchLatestTicket = async (context, orderField) => {

    const { items } = await listPage(context, '/tickets', { order_by: `${orderField}:desc`, limit: 1, trashed: false });
    if (!items.length) {
        return null;
    }
    return getTicket(context, items[0].id);
};

// Ticket messages ---------------------------------------------------------------------------

const getTicketMessage = async (context, ticketId, messageId) => {

    const { data } = await request(context, {
        method: 'GET',
        path: `/tickets/${ticketId}/messages/${messageId}`
    });
    return data;
};

/**
 * Newest messages, optionally of one ticket (GET /api/messages, newest first).
 */
const listLatestMessages = async (context, { ticketId, limit = 1 } = {}) => {

    const params = { order_by: 'created_datetime:desc', limit };
    if (ticketId) {
        params.ticket_id = ticketId;
    }
    const { items } = await listPage(context, '/messages', params);
    return items;
};

// HTTP integrations (webhooks) --------------------------------------------------------------
// Gorgias delivers ticket events through "HTTP integrations": a URL, a method and a templated
// body sent when one of the selected triggers fires. A trigger registers one integration that
// posts the ticket ID (and the message ID) to its webhook URL and reads the record back from
// the API, so the output does not depend on the template language.
// https://developers.gorgias.com/reference/create-integration

const TRIGGER_EVENTS = ['ticket_created', 'ticket_updated', 'ticket_message_created'];

// The webhook URL is public. Each integration sends a random secret in this header, the trigger
// keeps it in its state and ignores calls without it, so a forged POST cannot make it emit.
const WEBHOOK_SECRET_HEADER = 'x-appmixer-webhook-secret';

/**
 * Register an HTTP integration that calls the trigger's webhook URL on one ticket event.
 * @param {object} context
 * @param {'ticket_created'|'ticket_updated'|'ticket_message_created'} event
 * @returns {Promise<{integrationId: number, secret: string}>} save both in the trigger state
 */
const registerWebhook = async (context, event) => {

    const triggers = {};
    for (const name of TRIGGER_EVENTS) {
        triggers[name] = name === event;
    }
    const secret = crypto.randomBytes(32).toString('hex');
    const form = { event, ticket_id: '{{ticket.id}}' };
    if (event === 'ticket_message_created') {
        form.message_id = '{{message.id}}';
    }

    const { data } = await request(context, {
        method: 'POST',
        path: '/integrations',
        data: {
            type: 'http',
            name: `Appmixer ${event} ${context.componentId}`.slice(0, 250),
            description: 'Created by an Appmixer flow trigger. It is removed when the flow stops.',
            http: {
                url: context.getWebhookUrl(),
                method: 'POST',
                request_content_type: 'application/json',
                response_content_type: 'application/json',
                headers: { [WEBHOOK_SECRET_HEADER]: secret },
                form,
                triggers
            }
        }
    });
    return { integrationId: data.id, secret };
};

/**
 * True when a webhook call carries the secret this trigger registered with its integration.
 * Fails closed: no secret in the state (or none in the call) means the call is not authentic.
 */
const isAuthenticWebhook = (context) => {

    const expected = context.state && context.state.secret;
    const headers = (context.messages.webhook.content || {}).headers || {};
    const name = Object.keys(headers).find(key => key.toLowerCase() === WEBHOOK_SECRET_HEADER);
    const received = name ? headers[name] : undefined;
    if (typeof expected !== 'string' || !expected || typeof received !== 'string') {
        return false;
    }
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const unregisterWebhook = async (context, integrationId) => {

    if (!integrationId) {
        return;
    }
    try {
        await request(context, { method: 'DELETE', path: `/integrations/${integrationId}` });
    } catch (err) {
        const status = err.response && err.response.status;
        // Already removed in Gorgias.
        if (status !== 404) {
            throw err;
        }
    }
};

/**
 * A positive integer from a templated webhook field, or null ("{{message.id}}" left unrendered,
 * empty, not a number).
 */
const webhookId = (value) => {

    const text = value === undefined || value === null ? '' : String(value).trim();
    return /^\d+$/.test(text) && Number(text) > 0 ? Number(text) : null;
};

/**
 * Run fn once per key within the TTL, across concurrent webhook calls (Gorgias may retry).
 * @returns {Promise<boolean>} false when the key was seen already
 */
const onceByKey = async (context, key, ttl = 10 * 60 * 1000) => {

    let lock;
    try {
        lock = await context.lock(`gorgias-webhook-${context.componentId}`, {
            ttl: 10 * 1000,
            retryDelay: 500,
            maxRetryCount: 10
        });
        const cacheKey = `gorgias-webhook-${context.componentId}-${key}`;
        if (await context.staticCache.get(cacheKey)) {
            return false;
        }
        await context.staticCache.set(cacheKey, true, ttl);
        return true;
    } finally {
        if (lock) {
            await lock.unlock();
        }
    }
};

/**
 * Body of a webhook call, parsed when it arrives as a string.
 */
const webhookBody = (context) => {

    const content = context.messages.webhook.content || {};
    let data = content.data;
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (err) {
            data = {};
        }
    }
    return data || {};
};

// outputType helpers ------------------------------------------------------------------------

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value holding a
// comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    // An empty result set is ordinary: an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with a
    // different key order or a missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

module.exports = {

    SUBDOMAIN_PATTERN,
    PAGE_SIZE,
    apiOrigin,
    accountOrigin,
    authHeaders,
    request,
    requireId,
    optionalId,
    listItems,
    listPage,
    listPageCached,
    normalizeMultiselectInput,
    compact,
    getTicket,
    fetchLatestTicket,
    getTicketMessage,
    listLatestMessages,
    registerWebhook,
    unregisterWebhook,
    webhookId,
    isAuthenticWebhook,
    WEBHOOK_SECRET_HEADER,
    onceByKey,
    webhookBody,
    csvCell,
    toCsv,

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the account's
     * Gorgias host and refuse anything that would send the credential somewhere else.
     * Relative paths are relative to https://{subdomain}.gorgias.com; "/tickets" is read as
     * "/api/tickets".
     */
    resolveApiUrl(context, url) {

        const origin = accountOrigin(context);
        const text = String(url).trim();
        const absolute = /^[a-z][a-z0-9+.-]*:/i.test(text) || text.startsWith('//');
        let candidate = text;
        if (!absolute) {
            candidate = text.startsWith('/') ? text : '/' + text;
            if (!/^\/api(\/|$|\?)/.test(candidate)) {
                candidate = '/api' + candidate;
            }
        }

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
     * the JSON string of an object ('{"Accept":"application/json"}'). A plain object and an
     * array of {key, value} rows (also as a JSON string) are accepted too.
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

    async sendArrayOutput({ context, outputPortName = 'out', outputType = 'array', records = [] }) {

        if (outputType === 'first') {
            if (records.length === 0) {
                throw new context.CancelError('No records available for first output type');
            }
            await context.sendJson({ ...records[0], index: 0, count: records.length }, outputPortName);
        } else if (outputType === 'object') {
            for (let index = 0; index < records.length; index++) {
                await context.sendJson({ ...records[index], index, count: records.length }, outputPortName);
            }
        } else if (outputType === 'array') {
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {
            const csvString = toCsv(records);
            const buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    getOutputPortOptions(context, outputType, itemSchema, { label, value = 'result' }) {

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
                label,
                value,
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }, {
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
