'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_BASE_URL = 'https://harvest.greenhouse.io';
const TOKEN_URL = 'https://auth.greenhouse.io/token';
const DEFAULT_PREFIX = 'greenhouse-objects-export';

// Harvest v3 list endpoints return at most 500 records per page.
const MAX_PAGE_SIZE = 500;
// Polling triggers read at most this many pages in one tick.
const MAX_TRIGGER_PAGES = 10;
// Polling triggers re-read this window before the last tick so that records whose
// timestamps arrive late (clock skew, slow writes) are not missed. Records already
// seen in the window are recognised by their key in the state.
const TRIGGER_OVERLAP_MS = 10 * 60 * 1000;
// Wait at most this long for a 429 Retry-After before giving up.
const MAX_RETRY_AFTER_MS = 30 * 1000;
const MAX_RATE_LIMIT_RETRIES = 2;

const ID_PATTERN = /^\d+$/;

/**
 * Exchange the Harvest v3 client credentials for a bearer token
 * (OAuth 2.0 client credentials grant, HTTP Basic client authentication).
 * Used by auth.js and as the fallback when a stored token was rejected.
 * @param {function} httpRequest context.httpRequest
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Promise<{token: string, expires: number}>}
 */
async function requestToken(httpRequest, clientId, clientSecret) {

    const credentials = Buffer.from(clientId + ':' + clientSecret).toString('base64');
    const { data } = await httpRequest({
        method: 'POST',
        url: TOKEN_URL,
        headers: {
            'Authorization': 'Basic ' + credentials,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        data: 'grant_type=client_credentials'
    });

    if (!data || !data.access_token) {
        throw new Error('Greenhouse did not return an access token. Check the Client ID and Client Secret.');
    }

    return { token: data.access_token, expires: data.expires_in };
}

function authHeaders(context, token) {

    return { 'Authorization': 'Bearer ' + (token || context.auth.token) };
}

function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));
}

function retryAfterMs(err) {

    const headers = (err && err.response && err.response.headers) || {};
    const seconds = Number(headers['retry-after']);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 5000;
}

/**
 * Turn a Greenhouse error response into a readable message.
 * Harvest v3 answers { message, errors: [...] }.
 */
function toGreenhouseError(err) {

    const response = err && err.response;
    if (!response) {
        return err;
    }
    const body = response.data || {};
    const details = Array.isArray(body.errors)
        ? body.errors.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join('; ')
        : '';
    let message = 'Greenhouse API error ' + response.status + (body.message ? ': ' + body.message : '');
    if (details) {
        message += ' (' + details + ')';
    }
    if (response.status === 403) {
        message += '. The API credential is missing a permission for this endpoint: '
            + 'add it in Greenhouse under Configure > Dev Center > API Credential Management.';
    }
    const error = new Error(message);
    error.response = { status: response.status, data: body, headers: response.headers };
    return error;
}

/**
 * The one HTTP client of the connector. Adds the bearer token, honours Retry-After on 429
 * and, when the stored token was rejected, requests a fresh one with the stored credentials.
 * @param {object} context
 * @param {object} options { method, path, url, params, data, headers }
 * @returns {Promise<object>} the response ({ data, status, headers })
 */
async function apiRequest(context, { method = 'GET', path, url, params, data, headers = {} } = {}) {

    const target = url || (API_BASE_URL + path);
    let token;
    let refreshed = false;
    let rateLimitRetries = 0;

    for (;;) {
        try {
            const options = {
                method,
                url: target,
                headers: { 'Accept': 'application/json', ...headers, ...authHeaders(context, token) }
            };
            if (params && Object.keys(params).length) {
                options.params = params;
            }
            if (data !== undefined) {
                options.data = data;
            }
            return await context.httpRequest(options);
        } catch (err) {
            const status = err && err.response && err.response.status;
            if (status === 429 && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
                const wait = retryAfterMs(err);
                if (wait <= MAX_RETRY_AFTER_MS) {
                    rateLimitRetries += 1;
                    await sleep(wait);
                    continue;
                }
            }
            if (status === 401 && !refreshed && context.auth.clientId && context.auth.clientSecret) {
                refreshed = true;
                ({ token } = await requestToken(context.httpRequest, context.auth.clientId, context.auth.clientSecret));
                continue;
            }
            throw toGreenhouseError(err);
        }
    }
}

/**
 * Read the rel="next" URL of a Harvest v3 Link header.
 * @param {string} header
 * @returns {string|null}
 */
function parseNextLink(header) {

    if (!header) {
        return null;
    }
    const value = Array.isArray(header) ? header.join(',') : String(header);
    const match = value.match(/<([^>]+)>\s*;\s*rel="?next"?/i);
    return match ? match[1] : null;
}

/**
 * Read one page of a list endpoint. Filters go on the first request only; a next page is
 * read from the Link header URL as given (Harvest v3 refuses a cursor combined with filters).
 * The next URL is followed only when it stays on the Harvest API origin.
 * @returns {Promise<{records: Array, nextUrl: string|null}>}
 */
async function listPage(context, pathOrUrl, params) {

    let response;
    if (/^https:\/\//.test(pathOrUrl)) {
        if (new URL(pathOrUrl).origin !== API_BASE_URL) {
            throw new Error('Greenhouse returned a next page link outside ' + API_BASE_URL + '.');
        }
        response = await apiRequest(context, { url: pathOrUrl });
    } else {
        response = await apiRequest(context, { path: pathOrUrl, params });
    }
    const records = Array.isArray(response.data) ? response.data : [];
    const nextUrl = parseNextLink(response.headers && (response.headers.link || response.headers.Link));
    return { records, nextUrl };
}

/**
 * Read up to maxPages pages of a list endpoint.
 * @returns {Promise<{records: Array, truncated: boolean}>}
 */
async function listAll(context, path, params, maxPages) {

    const records = [];
    let page = await listPage(context, path, params);
    records.push(...page.records);
    let pages = 1;
    while (page.nextUrl && pages < maxPages) {
        page = await listPage(context, page.nextUrl);
        records.push(...page.records);
        pages += 1;
    }
    return { records, truncated: Boolean(page.nextUrl) };
}

/**
 * Harvest v3 date filters are pipe delimited: created_at=gte|2024-01-01T00:00:00Z.
 * @param {object} context
 * @param {string} operator gte, gt, lte or lt
 * @param {string|Date} value
 * @param {string} label human readable input name for the error message
 * @returns {string|undefined}
 */
function dateFilter(context, operator, value, label) {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
        throw new context.CancelError(label + ' must be a valid date and time.');
    }
    return operator + '|' + date.toISOString();
}

/**
 * Validate a numeric Greenhouse id before it is put into a URL path or a query.
 * @returns {string|undefined}
 */
function toId(context, value, label, { required = false } = {}) {

    if (value === undefined || value === null || value === '') {
        if (required) {
            throw new context.CancelError(label + ' is required!');
        }
        return undefined;
    }
    const id = String(value).trim();
    if (!ID_PATTERN.test(id)) {
        throw new context.CancelError(label + ' must be a numeric Greenhouse ID, got "' + value + '".');
    }
    return id;
}

/**
 * Read one record by id through the list endpoint's ids filter (Harvest v3 has no
 * GET /resource/{id} for candidates and applications).
 */
async function getById(context, path, id, label) {

    const { data } = await apiRequest(context, { path, params: { ids: id } });
    const record = Array.isArray(data) ? data.find(item => String(item.id) === String(id)) : null;
    if (!record) {
        throw new context.CancelError(label + ' ' + id + ' was not found.');
    }
    return record;
}

/**
 * Split a comma separated text input into a list of trimmed, non-empty values.
 */
function splitList(value) {

    if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean);
    }
    if (value === undefined || value === null) {
        return [];
    }
    return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * The profile fields shared by Create Candidate and Update Candidate.
 * Only inputs that were set are sent: PATCH leaves omitted keys untouched.
 */
function buildCandidateBody(input) {

    const body = {};
    const textFields = {
        firstName: 'first_name',
        lastName: 'last_name',
        preferredName: 'preferred_name',
        company: 'company',
        title: 'title'
    };
    for (const [inputName, apiName] of Object.entries(textFields)) {
        if (input[inputName] !== undefined && input[inputName] !== null && input[inputName] !== '') {
            body[apiName] = input[inputName];
        }
    }
    if (input.email) {
        body.email_addresses = [{ value: input.email, type: input.emailType || 'personal' }];
    }
    if (input.phone) {
        body.phone_numbers = [{ value: input.phone, type: input.phoneType || 'mobile' }];
    }
    const tags = splitList(input.tags);
    if (tags.length) {
        body.tags = tags;
    }
    return body;
}

function getCacheKey(obj) {

    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

/**
 * Cached read of the first page of a list endpoint, for inspector dropdowns.
 * The designer calls the sources in bursts; the lock lets one call fill the cache.
 */
async function listPageCached(context, path, params) {

    let lock;
    try {
        const key = getCacheKey({ connector: 'greenhouse', path, params, client: context.auth.clientId });
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const { records } = await listPage(context, path, params);
        await context.staticCache.set(key, records, context.config.listCacheTTL || (2 * 60 * 1000));
        return records;
    } finally {
        lock && await lock.unlock();
    }
}

/**
 * Shared polling engine of the triggers. Reads the records whose timestamp field is in the
 * window since the last tick (minus an overlap) and returns the ones not seen before.
 * The first tick only records a baseline and emits nothing.
 * @param {object} context
 * @param {object} options
 * @param {string} options.path list endpoint, e.g. /v3/candidates
 * @param {string} options.field created_at or updated_at
 * @param {object} options.params extra filters
 * @param {function} options.keyOf record => dedup key
 * @returns {Promise<Array|null>} new records, oldest first; null when the state was kept
 */
async function pollNewRecords(context, { path, field, params = {}, keyOf }) {

    const now = Date.now();
    const state = context.state || {};
    const since = state.since ? new Date(state.since).getTime() : now;
    const windowStart = new Date(since - TRIGGER_OVERLAP_MS).toISOString();

    const { records } = await listAll(
        context,
        path,
        { ...params, [field]: 'gte|' + windowStart, per_page: MAX_PAGE_SIZE },
        MAX_TRIGGER_PAGES
    );

    const known = Array.isArray(state.known) ? new Set(state.known) : null;

    // An empty answer while records of the window are known is suspicious (they should
    // still be in the window). Keep the state so the next complete answer is diffed
    // against what we know instead of re-firing it.
    if (known && known.size && !records.length) {
        return null;
    }

    const fresh = known ? records.filter(record => !known.has(keyOf(record))) : [];

    const keepFrom = now - TRIGGER_OVERLAP_MS;
    const nextKnown = records
        .filter(record => !record[field] || new Date(record[field]).getTime() >= keepFrom)
        .map(keyOf);

    await context.saveState({ since: new Date(now).toISOString(), known: nextKnown });

    // Harvest v3 returns the newest id first; emit the oldest first.
    return fresh.reverse();
}

module.exports = {

    API_BASE_URL,
    MAX_PAGE_SIZE,

    requestToken,
    authHeaders,
    apiRequest,
    parseNextLink,
    listPage,
    listAll,
    listPageCached,
    dateFilter,
    toId,
    getById,
    splitList,
    buildCandidateBody,
    pollNewRecords,

    /**
     * Run a tick under a lock so that a slow tick never overlaps the next one.
     */
    async withTickLock(context, fn) {

        let lock;
        try {
            lock = await context.lock(context.componentId, { ttl: 5 * 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            // Another tick of this component is still running.
            return;
        }
        try {
            return await fn();
        } finally {
            await lock.unlock();
        }
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the Harvest
     * API base and refuse anything that would send the bearer token somewhere else.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/v3/candidates') or absolute URL on the API host
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
            ? url
            : (url.startsWith('/') ? '' : '/') + url;

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw new context.CancelError('API Endpoint Path is not a valid URL: ' + url);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== API_BASE_URL) {
            throw new context.CancelError('API Endpoint Path must target ' + API_BASE_URL + ', got ' + parsed.origin + '.');
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
            throw new context.CancelError(label + ' must be valid JSON.');
        }
    },

    /**
     * Convert a key-value inspector input into a plain object. The Designer stores the rows
     * as the JSON string of an object; a plain object and an array of {key, value} rows are
     * accepted too, for values mapped from a variable.
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
            const buffer = Buffer.from(csvString, 'utf8');
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
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};

// One CSV cell per RFC 4180: null/undefined -> empty, objects -> JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    // An empty result set is ordinary: an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with
    // a different key order or a missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};
