'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// All Loops API endpoints live under this base URL.
// https://loops.so/docs/api-reference/intro
const API_ORIGIN = 'https://app.loops.so';
const API_BASE_URL = `${API_ORIGIN}/api`;

const DEFAULT_PREFIX = 'loops-objects-export';

// Loops answers 429 when the team exceeds its rate limit (10 requests per second,
// 60 per minute for the content API). The quota manager keeps us below that in
// most cases; a request that is throttled anyway is retried a few times with
// exponential backoff (honouring Retry-After when present), as the docs advise.
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const retryDelay = (error, attempt) => {

    const retryAfter = Number(error?.response?.headers?.['retry-after']);
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
        return Math.min(retryAfter * 1000, MAX_RETRY_DELAY_MS);
    }
    return Math.min(BASE_RETRY_DELAY_MS * Math.pow(2, attempt), MAX_RETRY_DELAY_MS);
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

module.exports = {

    API_ORIGIN,
    API_BASE_URL,

    /**
     * The one place that turns a connected account into request headers.
     * @param {object} context Appmixer component context
     * @returns {object}
     */
    authHeaders(context) {

        return { 'Authorization': `Bearer ${context.auth.apiKey}` };
    },

    /**
     * Authorized request to the Loops API with retry on 429.
     * @param {object} context Appmixer component context
     * @param {object} options { method, path, params, data, headers }
     * @returns {Promise<object>} the response
     */
    async request(context, { method = 'GET', path, params, data, headers = {} }) {

        const options = {
            method,
            url: `${API_BASE_URL}${path}`,
            headers: { ...headers, ...module.exports.authHeaders(context) }
        };
        if (params) options.params = params;
        if (data !== undefined) options.data = data;

        for (let attempt = 0; ; attempt++) {
            try {
                return await context.httpRequest(options);
            } catch (error) {
                if (error?.response?.status === 429 && attempt < MAX_RETRIES) {
                    await sleep(retryDelay(error, attempt));
                    continue;
                }
                throw error;
            }
        }
    },

    /**
     * Same as request(), but the response data is cached for a short time. Used by
     * the components that back inspector dropdowns (isSource): the designer fires
     * those calls in bursts, so one cached call replaces the whole burst.
     * @param {object} context Appmixer component context
     * @param {string} path API path, e.g. '/v1/lists'
     * @param {object} [params] query parameters
     * @returns {Promise<*>} response data
     */
    async requestCached(context, path, params = {}) {

        const key = 'loops_' + crypto.createHash('sha256')
            .update(JSON.stringify({ path, params, apiKey: context.auth.apiKey }))
            .digest('hex');
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            if (cached) {
                return cached;
            }
            const { data } = await module.exports.request(context, { path, params });
            await context.staticCache.set(key, data, context.config?.listCacheTTL || (2 * 60 * 1000));
            return data;
        } finally {
            lock?.unlock();
        }
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against
     * the Loops API base and refuse anything that would send the account's
     * API key somewhere else. Uses the WHATWG URL parser, so protocol-relative
     * input such as '//example.com/x' is rejected as a foreign origin.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/v1/lists') or absolute URL on the API host
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
        const candidate = isAbsolute ? url : `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;

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
     * Parse a textarea JSON input. Empty input means "nothing"; an object is
     * passed through (the designer may already have parsed a variable).
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string|object} value raw input
     * @param {string} label human readable input name for the error message
     * @param {object} [options] { object: true } to require a JSON object
     * @returns {*}
     */
    parseJsonInput(context, value, label, { object = false } = {}) {

        if (value === null || value === undefined || value === '') {
            return undefined;
        }

        let parsed = value;
        if (typeof value !== 'object') {
            try {
                parsed = JSON.parse(value);
            } catch (error) {
                throw new context.CancelError(`${label} must be valid JSON.`);
            }
        }

        if (object && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) {
            throw new context.CancelError(`${label} must be a JSON object.`);
        }
        return parsed;
    },

    /**
     * Convert a key-value inspector input into a plain object.
     * The Designer stores the rows as the JSON string of an object
     * ('{"Accept":"application/json"}'). A plain object and an array of
     * {key, value} rows (also as a JSON string) are accepted too.
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
    },

    /**
     * Normalize multiselect input (array or string) to an array.
     * Strings are treated as single values or comma-separated lists.
     * @param {string|string[]} input
     * @param {object} context
     * @param {string} fieldName human readable name for the error message
     * @returns {string[]}
     */
    normalizeMultiselectInput(input, context, fieldName) {

        if (Array.isArray(input)) {
            return input;
        } else if (typeof input === 'string') {
            return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else {
            throw new context.CancelError(`${fieldName} must be a string or an array`);
        }
    },

    /**
     * Build the Loops `mailingLists` object: { <listId>: true|false }.
     * @param {object} context
     * @param {string|string[]} subscribe list IDs to add the contact to
     * @param {string|string[]} [unsubscribe] list IDs to remove the contact from
     * @returns {object|undefined}
     */
    mailingListsInput(context, subscribe, unsubscribe) {

        const result = {};
        if (unsubscribe) {
            for (const id of module.exports.normalizeMultiselectInput(unsubscribe, context, 'Remove From Mailing Lists')) {
                result[id] = false;
            }
        }
        if (subscribe) {
            for (const id of module.exports.normalizeMultiselectInput(subscribe, context, 'Mailing Lists')) {
                result[id] = true;
            }
        }
        return Object.keys(result).length ? result : undefined;
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
