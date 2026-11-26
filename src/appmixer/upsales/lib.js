'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// One host for every production tenant; the API key identifies the account.
// https://api.upsales.com/
const API_ORIGIN = 'https://integration.upsales.com';
const API_BASE_URL = `${API_ORIGIN}/api/v2`;

// List endpoints: `limit` defaults to 1000, the maximum is 2000.
const MAX_PAGE_SIZE = 2000;

const DEFAULT_PREFIX = 'upsales-objects-export';

// Upsales answers 429 (ThrottleLimit) when a rate limit window is exceeded and sends
// X-RateLimit-Reset (seconds until the window resets). The quota manager keeps us below
// the limits in most cases; a throttled request is retried a few times.
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10000;

// Polling triggers remember the ids they emitted (NewOrder) - bounded.
const MAX_EMITTED_IDS = 2000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const retryDelay = (error, attempt) => {

    const reset = Number(error?.response?.headers?.['x-ratelimit-reset']);
    if (Number.isFinite(reset) && reset > 0) {
        return Math.min(reset * 1000, MAX_RETRY_DELAY_MS);
    }
    return Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, attempt), MAX_RETRY_DELAY_MS);
};

/**
 * The API key travels in the `token` query parameter, so it is part of every request URL.
 * Never let it reach an error message, a log entry or a component output.
 * @param {string} text
 * @returns {string}
 */
const redact = (text) => String(text).replace(/token=[^&\s"'#]*/gi, 'token=***');

/**
 * Turn a failed request into an error that carries the Upsales message and status
 * but not the request URL (which holds the API key).
 * @param {Error} error error thrown by context.httpRequest
 * @returns {Error}
 */
const apiError = (error) => {

    const status = error?.response?.status;
    const body = error?.response?.data;
    const detail = body?.error?.msg
        || body?.error?.message
        || (typeof body?.error === 'string' ? body.error : null)
        || body?.message
        || error?.message
        || 'Unknown error';
    const result = new Error(redact(`Upsales API request failed${status ? ` (${status})` : ''}: ${detail}`));
    result.statusCode = status;
    result.response = { status, data: body };
    result.isUpsalesError = true;
    return result;
};

/**
 * Add query parameters to a URL. Array values become repeated parameters
 * (`probability=gte:1&probability=lte:99`), the form the Upsales filter syntax uses.
 * Empty values are skipped.
 * @param {URL} url
 * @param {object} query
 */
const appendQuery = (url, query = {}) => {

    for (const [key, value] of Object.entries(query)) {
        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
            if (item === undefined || item === null || item === '') {
                continue;
            }
            url.searchParams.append(key, String(item));
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
    // An empty result set is ordinary (new account, filter matches nothing): an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with
    // a different key order or a missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

const changeKey = item => `${item.id}:${item.modDate}`;

module.exports = {

    API_ORIGIN,
    API_BASE_URL,
    MAX_PAGE_SIZE,

    redact,
    apiError,

    /**
     * Authorized request to the Upsales API, retried on 429.
     * @param {object} context Appmixer context (component or auth.js)
     * @param {object} options
     * @param {string} [options.method] HTTP method, GET by default
     * @param {string} [options.path] path under /api/v2, e.g. '/accounts'
     * @param {string} [options.url] absolute URL on the API host (MakeApiCall, already origin-checked)
     * @param {object} [options.query] query parameters, arrays become repeated parameters
     * @param {*} [options.data] JSON body
     * @param {object} [options.headers] extra headers
     * @param {string} [options.apiKey] key to use instead of context.auth.apiKey (auth.js)
     * @returns {Promise<object>} the response ({ data, status, headers })
     */
    async request(context, { method = 'GET', path, url, query, data, headers, apiKey } = {}) {

        const key = apiKey || context.auth?.apiKey;
        const target = new URL(url || `${API_BASE_URL}${path}`);
        appendQuery(target, query);
        target.searchParams.set('token', key);

        const options = { method, url: target.toString() };
        if (headers && Object.keys(headers).length) options.headers = headers;
        if (data !== undefined) options.data = data;

        for (let attempt = 0; ; attempt++) {
            try {
                const response = await context.httpRequest(options);
                const body = response.data;
                // Upsales reports some failures in the body of a 2xx answer.
                if (body && typeof body === 'object' && body.error && typeof body.error === 'object') {
                    throw apiError({ response: { status: response.status, data: body } });
                }
                return response;
            } catch (error) {
                if (error?.response?.status === 429 && attempt < MAX_RETRIES) {
                    await sleep(retryDelay(error, attempt));
                    continue;
                }
                throw error?.isUpsalesError ? error : apiError(error);
            }
        }
    },

    /**
     * One page of a list endpoint.
     * @param {object} context
     * @param {string} path e.g. '/accounts'
     * @param {object} query filters, sort, limit, offset
     * @returns {Promise<{items: object[], total: number}>}
     */
    async list(context, path, query = {}) {

        const { data } = await module.exports.request(context, { path, query });
        const items = Array.isArray(data?.data) ? data.data : [];
        const total = Number(data?.metadata?.total);
        return { items, total: Number.isFinite(total) ? total : items.length };
    },

    /**
     * Same as list(), but cached for a short time. Used by the private components that
     * back inspector dropdowns: the designer fires those calls in bursts.
     * @param {object} context
     * @param {string} path
     * @param {object} [query]
     * @returns {Promise<{items: object[], total: number}>}
     */
    async listCached(context, path, query = {}) {

        const key = 'upsales_' + crypto.createHash('sha256')
            .update(JSON.stringify({ path, query, apiKey: context.auth?.apiKey }))
            .digest('hex');
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            if (cached) {
                return cached;
            }
            const result = await module.exports.list(context, path, query);
            await context.staticCache.set(key, result, context.config?.listCacheTTL || (2 * 60 * 1000));
            return result;
        } finally {
            lock?.unlock();
        }
    },

    /**
     * The record that sorts last by `sortField` (ascending sort is the only documented
     * order, so the last one is read through the offset). Read-only, used to set the
     * starting point of a polling trigger and by the triggers' test().
     * @param {object} context
     * @param {string} path
     * @param {object} query filters
     * @param {string} sortField 'id' or 'modDate'
     * @returns {Promise<object|null>}
     */
    async latestRecord(context, path, query = {}, sortField = 'id') {

        const first = await module.exports.list(context, path, { ...query, sort: sortField, limit: 1 });
        if (!first.total || !first.items.length) {
            return null;
        }
        if (first.total === 1) {
            return first.items[0];
        }
        const last = await module.exports.list(context, path, {
            ...query, sort: sortField, limit: 1, offset: first.total - 1
        });
        return last.items[0] || null;
    },

    /**
     * Polling for new records with the keyset the API reference recommends
     * (`sort=id&id=gt:<last id>`). The first tick only records the newest id.
     * More than one page of new records is read over the following ticks.
     * @param {object} context trigger context
     * @param {string} path
     * @param {object} [query] extra filters
     */
    async pollNewRecords(context, path, query = {}) {

        const { lastId } = context.state;
        if (lastId === undefined || lastId === null) {
            const latest = await module.exports.latestRecord(context, path, query, 'id');
            return context.saveState({ lastId: latest ? Number(latest.id) : 0 });
        }

        const { items } = await module.exports.list(context, path, {
            ...query, sort: 'id', id: `gt:${lastId}`, limit: MAX_PAGE_SIZE
        });
        const fresh = items
            .filter(item => Number(item.id) > Number(lastId))
            .sort((a, b) => Number(a.id) - Number(b.id));
        if (!fresh.length) {
            return;
        }
        for (const item of fresh) {
            await context.sendJson(item, 'out');
        }
        return context.saveState({ lastId: Number(fresh[fresh.length - 1].id) });
    },

    /**
     * Polling for created or modified records with `modDate=gte:<since>`. A change is
     * identified by id + modDate, so a record that changes again fires again; the records
     * at the cursor's exact timestamp are remembered so they do not fire twice.
     * With `onceById` a record fires only the first time it matches (NewOrder).
     * @param {object} context trigger context
     * @param {string} path
     * @param {object} [query] extra filters
     * @param {object} [options] { onceById }
     */
    async pollChangedRecords(context, path, query = {}, { onceById = false } = {}) {

        const { since, boundary = [], emitted = [] } = context.state;
        if (!since) {
            return context.saveState({ since: new Date().toISOString(), boundary: [], emitted: [] });
        }

        const { items } = await module.exports.list(context, path, {
            ...query, modDate: `gte:${since}`, sort: 'modDate', limit: MAX_PAGE_SIZE
        });
        const withDate = items.filter(item => item.modDate);
        if (!withDate.length) {
            return;
        }

        const seen = new Set(boundary);
        const emittedIds = new Set(emitted.map(String));
        let newest = since;
        for (const item of withDate) {
            if (item.modDate > newest) newest = item.modDate;
        }

        const changed = withDate
            .filter(item => !seen.has(changeKey(item)))
            .filter(item => !onceById || !emittedIds.has(String(item.id)))
            .sort((a, b) => (a.modDate < b.modDate ? -1 : a.modDate > b.modDate ? 1 : 0));

        for (const item of changed) {
            await context.sendJson(item, 'out');
        }

        const atNewest = withDate.filter(item => item.modDate === newest).map(changeKey);
        const nextBoundary = newest === since ? [...new Set([...boundary, ...atNewest])] : atNewest;
        return context.saveState({
            since: newest,
            boundary: nextBoundary,
            emitted: onceById ? [...emitted, ...changed.map(item => String(item.id))].slice(-MAX_EMITTED_IDS) : []
        });
    },

    /**
     * Upsales ids are integers; inputs may arrive as strings from the inspector or variables.
     * @param {string|number} value
     * @returns {number|string|undefined}
     */
    toId(value) {

        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const text = String(value).trim();
        return /^\d+$/.test(text) ? Number(text) : text;
    },

    /**
     * A reference object as Upsales expects it: { id }.
     * @param {string|number} value
     * @returns {{id: number|string}|undefined}
     */
    ref(value) {

        const id = module.exports.toId(value);
        return id === undefined ? undefined : { id };
    },

    /**
     * A date-only value (YYYY-MM-DD), the format of order and task dates.
     * @param {object} context
     * @param {string} value
     * @param {string} label
     * @returns {string|undefined}
     */
    toDate(context, value, label) {

        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const text = String(value).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            return text;
        }
        const date = new Date(text);
        if (Number.isNaN(date.getTime())) {
            throw new context.CancelError(`${label} must be a date (YYYY-MM-DD).`);
        }
        return date.toISOString().slice(0, 10);
    },

    /**
     * An ISO 8601 date-time in UTC, the format of appointment dates and modDate.
     * @param {object} context
     * @param {string} value
     * @param {string} label
     * @returns {string|undefined}
     */
    toDateTime(context, value, label) {

        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new context.CancelError(`${label} must be a date and time.`);
        }
        return date.toISOString();
    },

    /**
     * Custom field values: a JSON array of { fieldId, value }.
     * @param {object} context
     * @param {string|Array} value
     * @returns {Array|undefined}
     */
    parseCustomFields(context, value) {

        const parsed = module.exports.parseJsonInput(context, value, 'Custom Fields');
        if (parsed === undefined) {
            return undefined;
        }
        if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item !== 'object' || item.fieldId === undefined)) {
            throw new context.CancelError('Custom Fields must be a JSON array of objects like [{"fieldId": 2, "value": "abc"}].');
        }
        return parsed;
    },

    /**
     * Order rows as Upsales expects them: [{ product: { id }, quantity, price, ... }].
     * Either a JSON array (`orderRows`, items with `productId` or `product: { id }`)
     * or one row built from `productId`, `quantity` and `price`.
     * @param {object} context
     * @param {object} input { orderRows, productId, quantity, price }
     * @returns {Array|undefined}
     */
    orderRows(context, { orderRows, productId, quantity, price } = {}) {

        const parsed = module.exports.parseJsonInput(context, orderRows, 'Order Rows');
        if (parsed !== undefined) {
            if (!Array.isArray(parsed) || !parsed.length) {
                throw new context.CancelError('Order Rows must be a non-empty JSON array.');
            }
            return parsed.map((row, index) => {
                if (!row || typeof row !== 'object') {
                    throw new context.CancelError(`Order Rows: row ${index + 1} must be an object.`);
                }
                const { productId: rowProductId, ...rest } = row;
                const product = rest.product || module.exports.ref(rowProductId);
                if (!product) {
                    throw new context.CancelError(`Order Rows: row ${index + 1} needs a productId.`);
                }
                return { quantity: 1, ...rest, product };
            });
        }
        if (productId === undefined || productId === null || productId === '') {
            if (price !== undefined && price !== null && price !== '') {
                throw new context.CancelError('Product is required for an order row!');
            }
            return undefined;
        }
        if (price === undefined || price === null || price === '') {
            throw new context.CancelError('Price is required for an order row!');
        }
        const row = {
            product: module.exports.ref(productId),
            quantity: quantity === undefined || quantity === null || quantity === '' ? 1 : Number(quantity),
            price: Number(price)
        };
        return [row];
    },

    /**
     * The probability filter of a deal type: opportunities 1-99 %, orders 100 %, lost 0 %.
     * @param {string} type 'all' | 'opportunity' | 'order' | 'lost'
     * @returns {string|string[]|undefined}
     */
    probabilityFilter(type) {

        if (type === 'opportunity') return ['gte:1', 'lte:99'];
        if (type === 'order') return '100';
        if (type === 'lost') return '0';
        return undefined;
    },

    /**
     * The activity type id of a to-do or a phone call (GET /todoTypes), cached.
     * @param {object} context
     * @param {string} type 'todo' | 'phoneCall'
     * @returns {Promise<number>}
     */
    async taskTypeId(context, type) {

        const key = 'upsales_todotypes_' + crypto.createHash('sha256').update(String(context.auth?.apiKey)).digest('hex');
        let types = await context.staticCache.get(key);
        if (!types) {
            const { data } = await module.exports.request(context, { path: '/todoTypes' });
            types = data?.data && !Array.isArray(data.data) ? data.data : data;
            await context.staticCache.set(key, types, context.config?.listCacheTTL || (2 * 60 * 1000));
        }
        const entry = type === 'phoneCall' ? types?.PHONE_CALL : types?.TODO;
        if (!entry?.id) {
            throw new context.CancelError(`The Upsales account has no ${type === 'phoneCall' ? 'phone call' : 'to-do'} task type.`);
        }
        return entry.id;
    },

    /**
     * Remove undefined, null and empty-string values from an object.
     * @param {object} obj
     * @returns {object}
     */
    compact(obj) {

        return Object.fromEntries(Object.entries(obj)
            .filter(([, value]) => value !== undefined && value !== null && value !== ''));
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the
     * Upsales API base and refuse anything that would send the API key somewhere else.
     * Uses the WHATWG URL parser, so protocol-relative input ('//example.com/x') is
     * rejected as a foreign origin.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/accounts') or absolute URL on the API host
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
        const candidate = isAbsolute ? url : `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw new context.CancelError('API Endpoint Path is not a valid URL.');
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== API_ORIGIN) {
            throw new context.CancelError(`API Endpoint Path must target ${API_ORIGIN}, got ${parsed.origin}.`);
        }

        // The key is added by request(); a token typed by the user is never forwarded.
        parsed.searchParams.delete('token');
        return parsed.toString();
    },

    /**
     * Parse a textarea JSON input. Empty input means "nothing"; an object is passed
     * through (the designer may already have parsed a variable).
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string|object} value raw input
     * @param {string} label human readable input name for the error message
     * @returns {*}
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
     * {key, value} rows (also as a JSON string) are accepted too.
     * @param {object} context
     * @param {string|object|Array<{key: string, value: *}>} value
     * @returns {object}
     */
    kvToObject(context, value) {

        let input = value;
        if (typeof input === 'string') {
            if (!input.trim()) {
                return {};
            }
            try {
                input = JSON.parse(input);
            } catch (error) {
                throw new context.CancelError('Request Headers and Query Parameters must be a JSON object of key-value pairs.');
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
