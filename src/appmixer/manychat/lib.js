'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_BASE_URL = 'https://api.manychat.com';
const DEFAULT_PREFIX = 'manychat-objects-export';
const DEFAULT_CACHE_TTL = 2 * 60 * 1000;

/**
 * Turn a Manychat error body into a readable message.
 * Manychat answers {"status": "error", "message": "...", "details": {"messages": [...]}}
 * (details.messages may be an array or an object of arrays) or {"status": "error", "message", "code"}.
 * @param {*} body
 * @returns {string|undefined}
 */
const errorMessage = function(body) {

    if (!body || typeof body !== 'object') {
        return typeof body === 'string' && body.trim() ? body.trim().slice(0, 500) : undefined;
    }
    const parts = [];
    if (typeof body.message === 'string' && body.message.trim()) {
        parts.push(body.message.trim());
    }
    const raw = body.details && body.details.messages;
    const groups = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? Object.values(raw) : []);
    for (const group of groups) {
        for (const item of (Array.isArray(group) ? group : [group])) {
            const text = typeof item === 'string' ? item : (item && item.message);
            if (typeof text === 'string' && text.trim() && !parts.includes(text.trim())) {
                parts.push(text.trim());
            }
        }
    }
    if (!parts.length) {
        return undefined;
    }
    const code = body.code !== undefined && body.code !== null ? ` (code ${body.code})` : '';
    return parts.join('; ') + code;
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
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

module.exports = {

    API_BASE_URL,

    errorMessage,

    /**
     * The one place that turns a connected account into request headers.
     * @param {object} context Appmixer component context
     * @returns {object}
     */
    authHeaders(context) {

        return { 'Authorization': `Bearer ${context.auth.apiKey}` };
    },

    /**
     * Call the Manychat API and return the `data` member of the response.
     * context.httpRequest throws on non-2xx; Manychat's error message is put on the error.
     * A 2xx answer whose status is not "success" is an error too.
     * @param {object} context Appmixer component context
     * @param {object} options
     * @param {string} [options.method] HTTP method, default GET
     * @param {string} options.path API path, e.g. '/fb/page/getTags'
     * @param {object} [options.params] query parameters
     * @param {object} [options.data] JSON body
     * @returns {Promise<*>} the `data` member of the response body
     */
    async request(context, { method = 'GET', path, params, data }) {

        const options = {
            method,
            url: API_BASE_URL + path,
            headers: module.exports.authHeaders(context)
        };
        if (params) {
            options.params = params;
        }
        if (data) {
            options.data = data;
        }

        let response;
        try {
            response = await context.httpRequest(options);
        } catch (err) {
            const message = err.response && errorMessage(err.response.data);
            if (message) {
                err.message = `Manychat: ${message}`;
            }
            throw err;
        }

        const body = response && response.data;
        if (!body || body.status !== 'success') {
            throw new Error(`Manychat: ${errorMessage(body) || 'unexpected response'}`);
        }
        return body.data;
    },

    /**
     * Manychat IDs are integers in request bodies. Accept a number or a string of digits
     * (variables arrive as strings) and send a number when it is a safe integer.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string|number} value
     * @param {string} label human readable input name
     * @returns {number|string}
     */
    toApiId(context, value, label) {

        const text = String(value).trim();
        if (!/^\d+$/.test(text)) {
            throw new context.CancelError(`${label} must be a numeric ID, got "${value}".`);
        }
        const number = Number(text);
        return Number.isSafeInteger(number) ? number : text;
    },

    /**
     * GET an endpoint and cache the result for the inspector's burst of dropdown calls.
     * The key covers the path, the query and the account's token.
     * @param {object} context Appmixer component context
     * @param {string} path API path
     * @param {object} [params] query parameters
     * @returns {Promise<*>} the `data` member of the response body
     */
    async requestCached(context, path, params) {

        const key = 'manychat-' + crypto.createHash('sha256')
            .update(JSON.stringify({ path, params, token: context.auth.apiKey }))
            .digest('hex');
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            if (cached) {
                return cached;
            }
            const data = await module.exports.request(context, { path, params });
            await context.staticCache.set(key, data, context.config.listCacheTTL || DEFAULT_CACHE_TTL);
            return data;
        } finally {
            lock && await lock.unlock();
        }
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the
     * Manychat API base and refuse anything that would send the API key elsewhere.
     * Resolving through the WHATWG URL parser and comparing the origin also rejects
     * protocol-relative input such as `//example.com/x`.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/fb/page/getTags') or absolute URL on the API host
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
            ? url
            : `${url.startsWith('/') ? '' : '/'}${url}`;

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== API_BASE_URL) {
            throw new context.CancelError(
                `API Endpoint Path must target ${API_BASE_URL}, got ${parsed.origin}.`
            );
        }

        return parsed.toString();
    },

    /**
     * Parse a textarea JSON input. Empty input means "no body"; an object is passed through.
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
     * {key, value} rows (also as a JSON string) are accepted too.
     * @param {object} context Appmixer component context (for CancelError)
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
