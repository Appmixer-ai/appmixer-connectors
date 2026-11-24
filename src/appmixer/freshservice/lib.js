'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Freshservice API v2: https://api.freshservice.com/
// Every account has its own host, https://<domain>.freshservice.com; the API works only on
// that host (not on custom CNAMEs).
const PAGE_SIZE = 100;
// Upper bound of what Find/List components and polling triggers read: 10 pages.
const MAX_PAGES = 10;
// The filter endpoints (?query="...") return 30 records per page.
const FILTER_PAGE_SIZE = 30;
// The service catalog lists at most 30 items per page.
const CATALOG_PAGE_SIZE = 30;

const DEFAULT_PREFIX = 'freshservice-objects-export';

// The domain is typed by the user and becomes the request host, and the API key is sent to
// that host. Accept the account name only ("acme"), or the full Freshservice host
// ("acme.freshservice.com"): "evil.example/x?" would otherwise send the key to evil.example.
const DOMAIN_PATTERN = /^([a-z0-9][a-z0-9-]*)(\.freshservice\.com)?$/i;

/**
 * The origin of the account's API. Every request goes through here: auth.js, the components
 * and MakeApiCall. Throws before any request when the domain is not a Freshservice account name.
 * @param {string} domain the Domain field of the connected account
 * @returns {string} https://<domain>.freshservice.com
 */
const serviceOrigin = (domain) => {

    const match = typeof domain === 'string' ? domain.match(DOMAIN_PATTERN) : null;
    if (!match) {
        throw new Error(
            'Invalid Freshservice domain. Enter the account name only, e.g. "acme" for acme.freshservice.com.'
        );
    }
    return `https://${match[1].toLowerCase()}.freshservice.com`;
};

const apiBaseUrl = domain => `${serviceOrigin(domain)}/api/v2`;

/**
 * Basic auth with the API key as the user name and "X" as the password, as the Freshservice
 * API v2 requires (username/password authentication is no longer supported).
 */
const authHeaders = (apiKey) => {

    // A pasted key often carries a trailing space or newline.
    const credentials = Buffer.from(`${String(apiKey || '').trim()}:X`).toString('base64');
    return { 'Authorization': `Basic ${credentials}` };
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * A readable message from a Freshservice error body: { description, errors: [{ field, message, code }] }.
 */
const errorDetail = (body) => {

    if (!body) {
        return '';
    }
    if (typeof body === 'string') {
        return body;
    }
    const parts = [];
    if (body.description) {
        parts.push(body.description);
    }
    if (body.message) {
        parts.push(body.message);
    }
    if (Array.isArray(body.errors)) {
        for (const error of body.errors) {
            parts.push([error.field, error.message, error.code ? `(${error.code})` : ''].filter(Boolean).join(' '));
        }
    }
    return parts.length ? parts.join('; ') : JSON.stringify(body);
};

/**
 * context.httpRequest on the account's API with the API key, a retry on 429 that honours
 * Retry-After, and a CancelError with the Freshservice message for request errors that a retry
 * cannot fix (validation, permissions, unknown IDs).
 * @param {object} context
 * @param {object} options { method, path (relative to /api/v2) or url, params, data, headers }
 */
const request = async (context, options, { maxRetries = 2 } = {}) => {

    const { method = 'GET', path, url, params, data, headers = {} } = options;
    const target = url || `${apiBaseUrl(context.auth.domain)}${path}`;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await context.httpRequest({
                method,
                url: target,
                params,
                data,
                headers: { ...headers, ...authHeaders(context.auth.apiKey) }
            });
        } catch (err) {
            const status = err.response && err.response.status;
            if (status === 429) {
                const retryAfter = parseInt((err.response.headers || {})['retry-after'], 10);
                const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000 * Math.pow(2, attempt);
                // Short waits are retried here; a long one goes back to the engine, which retries later.
                if (attempt < maxRetries && waitMs <= 15000) {
                    await context.log({ step: 'rate-limited', status, attempt, waitMs });
                    await sleep(waitMs);
                    attempt += 1;
                    continue;
                }
                throw err;
            }
            if ([400, 401, 403, 404, 405, 409, 415].includes(status)) {
                throw new context.CancelError(
                    `Freshservice returned ${status}: ${errorDetail(err.response.data) || err.message}`
                );
            }
            throw err;
        }
    }
};

/**
 * Freshservice IDs are numeric. Checking them before they go into a URL path keeps user input
 * from changing the path.
 */
const requireId = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(`${label} is required!`);
    }
    const text = String(value).trim();
    if (!/^\d+$/.test(text)) {
        throw new context.CancelError(`${label} must be a numeric Freshservice ID, got "${value}".`);
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
 * A text input that takes a comma-separated list, or an array from a variable.
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
 * ISO 8601 in UTC (YYYY-MM-DDTHH:MM:SSZ), the format Freshservice documents for date fields.
 */
const toIsoDate = (context, value, label) => {

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
 * A number from a select or a number input; empty means "not set".
 */
const optionalNumber = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
        throw new context.CancelError(`${label} must be a number, got "${value}".`);
    }
    return number;
};

/**
 * Drop the keys Freshservice sends as null (it returns blank fields as null), so an output
 * field is either present with a value of its type or absent.
 */
const withoutNulls = (record) => {

    const result = {};
    for (const [key, value] of Object.entries(record || {})) {
        if (value !== null && value !== undefined) {
            result[key] = value;
        }
    }
    return result;
};

/**
 * Keep only the keys whose value is set, for request bodies: an empty input is not sent.
 */
const compact = (body) => {

    const result = {};
    for (const [key, value] of Object.entries(body)) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        if (Array.isArray(value) && value.length === 0) {
            continue;
        }
        result[key] = value;
    }
    return result;
};

/**
 * Parse a textarea JSON input. Empty input means "no body"; an object is passed through
 * (the designer may already have parsed a variable).
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
        throw new context.CancelError(`${label} must be valid JSON.`);
    }
};

/**
 * Custom fields: a JSON object of field name (as in the Freshservice form fields) to value.
 */
const parseCustomFields = (context, value) => {

    const parsed = parseJsonInput(context, value, 'Custom Fields');
    if (parsed === undefined) {
        return undefined;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new context.CancelError('Custom Fields must be a JSON object, e.g. {"asset_tag": "LAP-042"}.');
    }
    return parsed;
};

/**
 * A query of the filter endpoints. The user writes the condition ("status:2 AND priority:4");
 * Freshservice wants it enclosed in double quotes and at most 512 characters long.
 */
const filterQuery = (context, value) => {

    let text = String(value || '').trim();
    if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
        text = text.slice(1, -1).trim();
    }
    if (!text) {
        return undefined;
    }
    const query = `"${text}"`;
    if (query.length > 512) {
        throw new context.CancelError('Query must be at most 512 characters long (Freshservice limit).');
    }
    return query;
};

/**
 * Read a paged list ({ <key>: [...] }) page by page, up to maxPages pages.
 * done gets each page and ends the reading early when it returns true.
 */
const listPages = async (context, path, key, params = {}, options = {}) => {

    const { maxPages = MAX_PAGES, pageSize = PAGE_SIZE, done } = options;

    const records = [];
    for (let page = 1; page <= maxPages; page++) {
        const { data } = await request(context, {
            method: 'GET',
            path,
            params: { ...params, page, per_page: pageSize }
        });
        const items = data && Array.isArray(data[key]) ? data[key] : [];
        records.push(...items);
        if (items.length < pageSize || (done && done(items))) {
            break;
        }
    }
    return records;
};

/**
 * Read a filter query (?query="...") page by page: 30 records a page, until the reported
 * total is read, up to maxPages pages.
 */
const filterPages = async (context, path, key, params = {}, { maxPages = MAX_PAGES } = {}) => {

    const records = [];
    for (let page = 1; page <= maxPages; page++) {
        const { data } = await request(context, { method: 'GET', path, params: { ...params, page } });
        const items = data && Array.isArray(data[key]) ? data[key] : [];
        records.push(...items);
        const total = data && Number.isFinite(data.total) ? data.total : undefined;
        if (items.length < FILTER_PAGE_SIZE || (total !== undefined && records.length >= total)) {
            break;
        }
    }
    return records;
};

/**
 * The ticket fields shared by Create Ticket and Update Ticket, in the shape of the API.
 * Empty inputs are left out, so an update changes only what was filled in.
 */
const ticketFields = (context, content) => {

    return compact({
        subject: content.subject,
        description: content.description,
        status: optionalNumber(context, content.status, 'Status'),
        priority: optionalNumber(context, content.priority, 'Priority'),
        urgency: optionalNumber(context, content.urgency, 'Urgency'),
        impact: optionalNumber(context, content.impact, 'Impact'),
        group_id: optionalId(context, content.groupId, 'Group ID'),
        responder_id: optionalId(context, content.responderId, 'Agent ID'),
        department_id: optionalId(context, content.departmentId, 'Department ID'),
        category: content.category,
        sub_category: content.subCategory,
        item_category: content.itemCategory,
        due_by: toIsoDate(context, content.dueBy, 'Due By'),
        tags: splitList(content.tags),
        custom_fields: parseCustomFields(context, content.customFields)
    });
};

const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

/**
 * Cached read for inspector sources: the designer calls them in bursts when an inspector opens.
 * The key covers the account (domain + API key) and the request.
 */
const cached = async (context, keyParts, fetch) => {

    let lock;
    try {
        const key = `freshservice-source-${hash({ ...keyParts, domain: context.auth.domain, key: context.auth.apiKey })}`;
        lock = await context.lock(key);
        const hit = await context.staticCache.get(key);
        if (hit) {
            return hit;
        }
        const records = await fetch();
        await context.staticCache.set(key, records, context.config.listCacheTTL || (2 * 60 * 1000));
        return records;
    } finally {
        lock?.unlock();
    }
};

/**
 * Paging of a polling trigger over a list sorted newest first by field. Without since
 * (the baseline, Flow Test Mode) one page is enough. With it, pages are read until one holds a
 * record older than since, so more than a page of new records between two checks is emitted
 * whole. MAX_PAGES still bounds the reading (1,000 records per check).
 */
const pagesSince = (field, since) => {

    if (since === undefined || since === null) {
        return { maxPages: 1 };
    }
    return {
        maxPages: MAX_PAGES,
        done: items => items.some(item => new Date(item[field]).getTime() < since)
    };
};

/**
 * Shared body of the "new record" triggers. fetch(since) returns the records newest first by
 * field (a timestamp), back to the timestamp since (see pagesSince); since is undefined on
 * the first run. State: { initialized, lastTimestamp, known }.
 *   - The first run only remembers where the account stands and emits nothing.
 *   - A record is emitted when its timestamp is newer than the last one seen, or equal to it
 *     and its ID is not among the known IDs of that boundary timestamp.
 *   - An empty answer while records were seen before keeps the state: a degraded answer must
 *     not become the baseline.
 */
const pollByTimestamp = async (context, { fetch, field, port = 'out' }) => {

    let lock;
    try {
        lock = await context.lock(context.componentId, { ttl: 2 * 60 * 1000, maxRetryCount: 0 });
    } catch (err) {
        // Another tick is still running.
        return;
    }

    try {
        const state = context.state || {};
        const since = state.initialized ? (state.lastTimestamp || 0) : undefined;
        const records = (await fetch(since)).filter(record => record && record[field]);
        const time = record => new Date(record[field]).getTime();

        if (state.initialized && state.lastTimestamp && !records.length) {
            return;
        }

        const newest = records.reduce((max, record) => Math.max(max, time(record)), 0);
        const lastTimestamp = state.lastTimestamp || 0;
        const boundary = Math.max(newest, lastTimestamp);
        const knownAtBoundary = records.filter(record => time(record) === boundary).map(record => String(record.id));

        if (!state.initialized) {
            return await context.saveState({ initialized: true, lastTimestamp: boundary, known: knownAtBoundary });
        }

        const known = new Set((state.known || []).map(String));
        const fresh = records
            .filter(record => time(record) > lastTimestamp
                || (time(record) === lastTimestamp && !known.has(String(record.id))))
            .sort((a, b) => time(a) - time(b));

        for (const record of fresh) {
            await context.sendJson(record, port);
        }

        await context.saveState({
            initialized: true,
            lastTimestamp: boundary,
            // IDs sharing the boundary timestamp, so a record written in the same second is
            // neither skipped nor emitted twice.
            known: boundary === lastTimestamp ? [...new Set([...known, ...knownAtBoundary])] : knownAtBoundary
        });
    } finally {
        lock?.unlock();
    }
};

// Updates are read again for this long before the last seen update: the list is filtered by
// updated_since at a one-second resolution, and a write committed late must not be missed.
const UPDATE_OVERLAP = 2 * 60 * 1000;

const isoSeconds = ms => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

/**
 * Shared body of the "updated record" triggers. fetch(sinceIso) returns every record updated
 * since that time, in any order. A record is emitted once per update: the key is ID + updated_at.
 * accept drops records the trigger does not report (e.g. a creation).
 * State: { initialized, since, seen }.
 */
const pollUpdates = async (context, { fetch, accept, port = 'out', now = Date.now() }) => {

    let lock;
    try {
        lock = await context.lock(context.componentId, { ttl: 2 * 60 * 1000, maxRetryCount: 0 });
    } catch (err) {
        // Another tick is still running.
        return;
    }

    try {
        const state = context.state || {};
        if (!state.initialized) {
            // First run: only updates from now on are reported.
            return await context.saveState({ initialized: true, since: now, seen: [] });
        }

        const since = state.since || now;
        const windowStart = since - UPDATE_OVERLAP;
        const records = (await fetch(isoSeconds(windowStart))).filter(record => record && record.updated_at);
        if (!records.length) {
            return;
        }

        const time = record => new Date(record.updated_at).getTime();
        const key = record => `${record.id}|${record.updated_at}`;
        const seen = new Set(state.seen || []);

        const fresh = records
            .filter(record => time(record) >= windowStart && !seen.has(key(record)))
            .sort((a, b) => time(a) - time(b));

        for (const record of fresh) {
            if (!accept || accept(record)) {
                await context.sendJson(record, port);
            }
        }

        const newest = records.reduce((max, record) => Math.max(max, time(record)), since);
        // Keys inside the overlap window are kept, so the next check does not emit them again.
        const keep = [...seen, ...fresh.map(key)].filter(item => {
            const updatedAt = new Date(item.slice(item.indexOf('|') + 1)).getTime();
            return updatedAt >= newest - UPDATE_OVERLAP;
        });
        await context.saveState({ initialized: true, since: newest, seen: [...new Set(keep)] });
    } finally {
        lock?.unlock();
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

    // An empty result set is ordinary (new account, filter matches nothing): an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with
    // a different key order or a missing key stays under the right header.
    const columns = [...new Set(records.flatMap(record => Object.keys(record)))];
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

module.exports = {

    PAGE_SIZE,
    MAX_PAGES,
    FILTER_PAGE_SIZE,
    CATALOG_PAGE_SIZE,
    UPDATE_OVERLAP,

    serviceOrigin,
    apiBaseUrl,
    authHeaders,
    errorDetail,
    request,
    requireId,
    optionalId,
    splitList,
    idList,
    toIsoDate,
    optionalNumber,
    withoutNulls,
    compact,
    parseJsonInput,
    parseCustomFields,
    filterQuery,
    listPages,
    filterPages,
    ticketFields,
    cached,
    pagesSince,
    pollByTimestamp,
    pollUpdates,
    toCsv,

    /**
     * Resolve a MakeApiCall URL. A relative path is resolved against the account's API
     * (https://<domain>.freshservice.com/api/v2), a path starting with /api/ against the account's
     * host. A full URL is accepted only on that host, so the API key is never sent elsewhere.
     */
    resolveApiUrl(context, url) {

        const origin = serviceOrigin(context.auth.domain);
        const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
        let candidate = url;
        if (!isAbsolute) {
            const path = url.startsWith('/') ? url : `/${url}`;
            candidate = path.startsWith('/api/') ? `${origin}${path}` : `${origin}/api/v2${path}`;
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
                label,
                value: 'result',
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }, {
                label: 'Count',
                value: 'count',
                schema: { type: 'integer' }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
