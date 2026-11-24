'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Qlik Cloud REST APIs are versioned by release (YYYY-MM). The header tells Qlik which release
// the connector knows; omitted, Qlik assumes the oldest supported one.
const API_VERSION = '2026-11';
const DEFAULT_PREFIX = 'qliksense-objects-export';

// Most Qlik list endpoints accept 1-100 items per page.
const PAGE_SIZE = 100;

// A Qlik Cloud tenant hostname: <tenant>.<region>.qlikcloud.com (or qlikcloudgov.com).
// The value becomes the host of every request that carries the API key, so it is allowlisted
// before any URL is built (see tenantOrigin()).
const HOST_LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';
const TENANT_HOST_PATTERN = new RegExp('^' + HOST_LABEL + '(?:\\.' + HOST_LABEL + ')*\\.qlikcloud(?:gov)?\\.com$', 'i');

const cancelError = (context, message) => {

    return context && context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * The origin of the connected tenant, from the Tenant field as typed: either the hostname
 * (acme.eu.qlikcloud.com) or an https URL of the tenant (https://acme.eu.qlikcloud.com/).
 * Anything that is not a qlikcloud.com host is rejected before a request is made, so the API
 * key is never sent to another host. The stored value is parsed the same way on every call.
 * @param {string} tenant
 * @returns {string} https origin, e.g. https://acme.eu.qlikcloud.com
 */
const tenantOrigin = (tenant) => {

    const value = typeof tenant === 'string' ? tenant.trim() : '';
    let host = value;
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
        let parsed;
        try {
            parsed = new URL(value);
        } catch (err) {
            parsed = null;
        }
        if (!parsed || parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port
            || (parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
            host = '';
        } else {
            host = parsed.hostname;
        }
    }
    if (!host || !TENANT_HOST_PATTERN.test(host)) {
        throw new Error('Invalid Qlik Cloud tenant. Enter the tenant hostname, for example "acme.eu.qlikcloud.com".');
    }
    return 'https://' + host.toLowerCase();
};

/**
 * The tenant and API key of the account. Components read them from context.auth,
 * auth.js callbacks from the context itself.
 * @param {object} context
 * @returns {{tenant: string, apiKey: string}}
 */
const credentials = (context) => {

    const source = context.auth && context.auth.apiKey ? context.auth : context;
    return { tenant: source.tenant, apiKey: source.apiKey };
};

/**
 * The one place that turns the connected account into request headers.
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    return {
        'Authorization': 'Bearer ' + credentials(context).apiKey,
        'qlik-api-version': API_VERSION
    };
};

const baseUrl = (context) => {

    try {
        return tenantOrigin(credentials(context).tenant);
    } catch (err) {
        throw cancelError(context, err.message);
    }
};

/**
 * Turn a Qlik error response ({ errors: [{ code, title, detail }] }) into a readable message.
 * @param {object} err
 * @returns {string|null}
 */
const errorDetail = (err) => {

    const body = err && err.response && err.response.data;
    // Some Qlik endpoints answer a 4xx with a plain-text (or empty) body instead of { errors }.
    if (typeof body === 'string' && body.trim()) {
        return body.trim().slice(0, 500);
    }
    if (!body || typeof body !== 'object') {
        return null;
    }
    const errors = Array.isArray(body.errors) ? body.errors : (body.error ? [body.error] : []);
    const parts = errors.map(item => {
        if (!item || typeof item !== 'object') {
            return String(item);
        }
        return [item.code, item.title, item.detail].filter(Boolean).join(': ');
    }).filter(Boolean);
    if (!parts.length && body.message) {
        parts.push(body.message);
    }
    return parts.length ? parts.join('; ') : null;
};

/**
 * Call the Qlik Cloud REST API of the connected tenant.
 * Client errors (400, 401, 403, 404, 409, ...) become a CancelError with Qlik's own message,
 * since retrying cannot fix them; 429 and 5xx stay retryable.
 * @param {object} context
 * @param {object} options { method, path, params, data, headers, responseType }
 * @returns {Promise<object>} the axios-like response
 */
const apiRequest = async (context, { method = 'GET', path, url, params, data, headers = {}, responseType } = {}) => {

    const requestUrl = url || (baseUrl(context) + path);
    const options = {
        method,
        url: requestUrl,
        headers: { ...headers, ...authHeaders(context) }
    };
    if (params && Object.keys(params).length) {
        options.params = params;
    }
    if (data !== undefined) {
        options.data = data;
    }
    if (responseType) {
        options.responseType = responseType;
    }
    try {
        return await context.httpRequest(options);
    } catch (err) {
        const status = err && err.response && err.response.status;
        const detail = errorDetail(err);
        const message = 'Qlik Cloud API error' + (status ? ' (' + status + ')' : '') + ': '
            + (detail || err.message);
        const retryable = !status || status >= 500 || status === 429 || status === 408;
        const error = retryable ? new Error(message) : cancelError(context, message);
        error.status = status;
        throw error;
    }
};

const isNotFound = (err) => Boolean(err && err.status === 404);

/**
 * The cursor of the next page in a Qlik list response (links.next.href), or null.
 * @param {object} body
 * @returns {string|null}
 */
const nextPageUrl = (body) => {

    const href = body && body.links && body.links.next && body.links.next.href;
    return href || null;
};

// Mappers ------------------------------------------------------------------------------------

const pick = (source, keys) => {

    const result = {};
    for (const key of keys) {
        if (source && source[key] !== undefined) {
            result[key] = source[key];
        }
    }
    return result;
};

/**
 * An app from the Apps API (GET/POST /api/v1/apps...), flattened from its attributes.
 * @param {object} body
 * @returns {object}
 */
const mapApp = (body) => {

    const attributes = (body && body.attributes) || {};
    return pick(attributes, [
        'id', 'name', 'description', 'spaceId', 'ownerId', 'usage', 'createdDate', 'modifiedDate',
        'lastReloadTime', 'publishTime', 'published', 'originAppId', 'hasSectionAccess',
        'isDirectQueryMode', 'encrypted', 'thumbnail'
    ]);
};

/**
 * An app as listed by the Items API. The app ID is the item's resourceId, not the item id.
 * @param {object} item
 * @returns {object}
 */
const mapAppItem = (item) => {

    return {
        id: item.resourceId,
        itemId: item.id,
        name: item.name,
        description: item.description,
        resourceType: item.resourceType,
        spaceId: item.spaceId,
        ownerId: item.ownerId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        lastReloadStatus: item.resourceReloadStatus,
        lastReloadEndTime: item.resourceReloadEndTime
    };
};

const mapReload = (reload) => ({
    ...pick(reload, [
        'id', 'appId', 'status', 'type', 'partial', 'userId', 'tenantId', 'weight', 'creationTime',
        'startTime', 'endTime', 'engineTime', 'errorCode', 'errorMessage', 'log'
    ]),
    succeeded: reload.status === 'SUCCEEDED'
});

// The final statuses of a reload; QUEUED, RELOADING and CANCELING are still active.
const RELOAD_FINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'CANCELED', 'EXCEEDED_LIMIT'];

const mapSpace = (space) => pick(space, [
    'id', 'name', 'type', 'description', 'ownerId', 'tenantId', 'createdAt', 'createdBy', 'updatedAt'
]);

const mapDataFile = (file) => pick(file, [
    'id', 'name', 'baseName', 'size', 'spaceId', 'ownerId', 'appId', 'folder', 'folderId', 'folderPath',
    'createdDate', 'modifiedDate', 'contentUpdatedDate', 'qri'
]);

const mapUser = (user) => pick(user, [
    'id', 'name', 'email', 'status', 'subject', 'tenantId', 'locale', 'zoneinfo', 'picture', 'createdAt',
    'lastUpdatedAt'
]);

const mapAutomation = (automation) => pick(automation, [
    'id', 'name', 'description', 'state', 'runMode', 'spaceId', 'ownerId', 'createdAt', 'updatedAt',
    'lastRunAt', 'lastRunStatus'
]);

// The final statuses of an automation run.
const RUN_FINAL_STATUSES = ['finished', 'finished with warnings', 'failed', 'stopped', 'exceeded limit', 'must stop'];
const RUN_SUCCESS_STATUSES = ['finished', 'finished with warnings'];

const mapAutomationRun = (run, automationId) => ({
    automationId,
    ...pick(run, [
        'id', 'title', 'status', 'context', 'ownerId', 'spaceId', 'executedById', 'createdAt', 'startTime',
        'stopTime', 'updatedAt'
    ]),
    succeeded: RUN_SUCCESS_STATUSES.includes(run.status)
});

// Shared fetches -----------------------------------------------------------------------------

/**
 * The DataFiles connection of a space (data files are addressed by connection, not by space).
 * Without a space the personal space is used, which needs no connection.
 * @param {object} context
 * @param {string} [spaceId]
 * @returns {Promise<string|undefined>}
 */
const dataFilesConnectionId = async (context, spaceId) => {

    if (!spaceId) {
        return undefined;
    }
    const { data } = await apiRequest(context, {
        path: '/api/v1/data-files/connections',
        params: { spaceId }
    });
    const connection = ((data && data.data) || []).find(item => item.spaceId === spaceId);
    if (!connection) {
        throw cancelError(context, 'No data files connection found for space ' + spaceId
            + '. Check the Space ID and that you are a member of the space.');
    }
    return connection.id;
};

const getCacheKey = (obj) => {

    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
};

/**
 * Cache the result of fn() for dynamic inspector sources. The designer fires source calls in
 * concurrent bursts; the lock lets the first call fill the cache for the rest.
 * @param {object} context
 * @param {object} keyParts every input that shapes the result
 * @param {Function} fn
 * @returns {Promise<*>}
 */
const callCached = async (context, keyParts, fn) => {

    const { tenant, apiKey } = credentials(context);
    const key = 'qliksense-' + getCacheKey({ ...keyParts, tenant, apiKey });
    let lock;
    try {
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const value = await fn();
        await context.staticCache.set(key, value, context.config.listCacheTTL || (2 * 60 * 1000));
        return value;
    } finally {
        lock && await lock.unlock();
    }
};

// Async jobs (continuation chain) -------------------------------------------------------------

// Appmixer does not schedule a continuation sooner than one minute, so that is the poll interval.
const POLL_INTERVAL_MS = 60 * 1000;

/**
 * The deadline of a job from a timeout in minutes typed by the user.
 * @param {*} minutes
 * @param {number} fallback
 * @param {number} max
 * @returns {number} epoch ms
 */
const deadlineFrom = (minutes, fallback, max) => {

    const value = Number(minutes);
    const safe = Number.isFinite(value) && value > 0 ? Math.min(value, max) : fallback;
    return Date.now() + safe * 60 * 1000;
};

// Webhook triggers ----------------------------------------------------------------------------

const TOKEN_PARAM = 'token';

/**
 * The event type to subscribe to, as the tenant lists it in GET /api/core/webhooks/event-types.
 * Qlik has renamed some event types (com.qlik.app.created vs com.qlik.v1.app.created), so the
 * candidates are matched against the tenant's own list.
 * @param {object} context
 * @param {string[]} candidates
 * @returns {Promise<{name: string, levels: string[]}>}
 */
const resolveEventType = async (context, candidates) => {

    const { data } = await apiRequest(context, { path: '/api/core/webhooks/event-types' });
    const types = (data && data.data) || [];
    for (const candidate of candidates) {
        const match = types.find(type => type.name === candidate);
        if (match) {
            return { name: match.name, levels: match.levels || [] };
        }
    }
    throw cancelError(context, 'The Qlik Cloud tenant does not offer the webhook event ' + candidates[0] + '.');
};

/**
 * Register a webhook for this trigger instance. The callback URL carries a random token that
 * receive() checks, so a request that does not come from this registration is ignored.
 * User-level webhooks are used where the event type supports them (they need no TenantAdmin role).
 * @param {object} context
 * @param {object} options { candidates, name, filter }
 * @returns {Promise<void>}
 */
const registerWebhook = async (context, { candidates, name, filter }) => {

    const eventType = await resolveEventType(context, candidates);
    const level = !eventType.levels.length || eventType.levels.includes('user') ? 'user' : 'tenant';
    const token = crypto.randomBytes(24).toString('hex');
    const base = context.getWebhookUrl();
    const url = base + (base.indexOf('?') === -1 ? '?' : '&') + TOKEN_PARAM + '=' + token;
    const body = {
        name: ('Appmixer: ' + name).slice(0, 255),
        description: 'Created by Appmixer flow ' + context.flowId + ' (component ' + context.componentId + ').',
        url,
        eventTypes: [eventType.name],
        level,
        enabled: true
    };
    if (filter) {
        body.filter = filter;
    }
    const { data } = await apiRequest(context, { method: 'POST', path: '/api/core/webhooks', data: body });
    return context.saveState({ webhookId: data.id, token, eventType: eventType.name });
};

const unregisterWebhook = async (context) => {

    const state = await context.loadState() || {};
    if (!state.webhookId) {
        return;
    }
    try {
        await apiRequest(context, { method: 'DELETE', path: '/api/core/webhooks/' + encodeURIComponent(state.webhookId) });
    } catch (err) {
        // Already gone (deleted in Qlik or disabled after delivery failures): nothing to clean up.
        if (!isNotFound(err)) {
            throw err;
        }
    }
};

/**
 * The CloudEvent of a webhook delivery, or null when the request is not from this
 * registration (wrong token) or is not an event of the subscribed type.
 * @param {object} context
 * @returns {Promise<object|null>}
 */
const readWebhookEvent = async (context) => {

    const content = context.messages.webhook.content || {};
    const state = await context.loadState() || {};
    const token = (content.query || {})[TOKEN_PARAM];
    if (!state.token || !token || token.length !== state.token.length
        || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(state.token))) {
        await context.log({ step: 'Ignoring a webhook request without a valid token.' });
        return null;
    }
    const event = content.data;
    if (!event || typeof event !== 'object' || (state.eventType && event.type && event.type !== state.eventType)) {
        await context.log({ step: 'Ignoring a webhook request of another event type.', type: event && event.type });
        return null;
    }
    return event;
};

// MakeApiCall helpers -------------------------------------------------------------------------

/**
 * Resolve a user supplied endpoint (relative path or absolute URL) against the tenant origin and
 * refuse anything that would send the API key somewhere else.
 * @param {object} context
 * @param {string} url
 * @returns {string}
 */
const resolveApiUrl = (context, url) => {

    const origin = baseUrl(context);
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
        ? url
        : (url.startsWith('/') ? '' : '/') + url;

    let parsed;
    try {
        parsed = new URL(candidate, origin);
    } catch (error) {
        throw new context.CancelError('API Endpoint Path is not a valid URL: ' + url);
    }

    if (parsed.username || parsed.password) {
        throw new context.CancelError('API Endpoint Path must not contain credentials.');
    }

    if (parsed.origin !== origin) {
        throw new context.CancelError('API Endpoint Path must target ' + origin + ', got ' + parsed.origin + '.');
    }

    return parsed.toString();
};

/**
 * Parse a textarea JSON input. Empty input means "no body"; an object is passed through.
 * @param {object} context
 * @param {string|object} value
 * @param {string} label
 * @returns {object|undefined}
 */
const parseJsonInput = (context, value, label) => {

    if (value === null || value === undefined || value === '') {
        return undefined;
    }
    if (typeof value === 'object') {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        throw new context.CancelError(label + ' must be valid JSON.');
    }
};

/**
 * Convert a key-value inspector input into a plain object. The Designer stores the rows as
 * the JSON string of an object; a plain object and an array of {key, value} rows are accepted too.
 * @param {string|object|Array<{key: string, value: *}>} value
 * @returns {object}
 */
const kvToObject = (value) => {

    let input = value;
    if (typeof input === 'string') {
        if (!input.trim()) {
            return {};
        }
        try {
            input = JSON.parse(input);
        } catch (error) {
            throw new Error('Key-value inputs must be a JSON object of key-value pairs.');
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
};

// outputType helpers --------------------------------------------------------------------------

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    // An empty result set is ordinary (new account, filter matches nothing): an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with
    // a different key order or a missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

module.exports = {

    API_VERSION,
    PAGE_SIZE,
    POLL_INTERVAL_MS,

    tenantOrigin,
    authHeaders,
    baseUrl,
    apiRequest,
    isNotFound,
    nextPageUrl,
    mapApp,
    mapAppItem,
    mapReload,
    mapSpace,
    mapDataFile,
    mapUser,
    mapAutomation,
    mapAutomationRun,
    RELOAD_FINAL_STATUSES,
    RUN_FINAL_STATUSES,
    dataFilesConnectionId,
    callCached,
    deadlineFrom,
    resolveEventType,
    registerWebhook,
    unregisterWebhook,
    readWebhookEvent,
    resolveApiUrl,
    parseJsonInput,
    kvToObject,
    toCsv,

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
            const fileName = (context.config.outputFilePrefix || DEFAULT_PREFIX) + '-' + componentName + '.csv';
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {
        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: label, ...schemaWithoutTitle } = schema;
                    res.push({ label, value: field, schema: schemaWithoutTitle });
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
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
