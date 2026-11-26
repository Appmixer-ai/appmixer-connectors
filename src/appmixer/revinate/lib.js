'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Helpers shared by the two Revinate modules. Everything that knows an API (origin, credentials,
// request signing, response shapes) lives in the module's own lib.js: reputation/lib.js for the
// Porter API and cdp/lib.js for the CDP API. The two APIs use different credentials, and nothing
// in this file ever touches a credential.

const DEFAULT_PREFIX = 'revinate-objects-export';

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

/**
 * A CancelError in a component, the given fallback class in auth.js (the auth context has no
 * CancelError).
 * @param {object} context
 * @param {string} message
 * @returns {Error}
 */
const cancelError = (context, message) => {

    return context && context.CancelError ? new context.CancelError(message) : new Error(message);
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
    // a different key order or a missing key stays under the right header. The columns are the
    // union of the keys of all records: Revinate leaves out fields that have no value.
    const columns = [];
    for (const record of records) {
        for (const key of Object.keys(record)) {
            if (!columns.includes(key)) {
                columns.push(key);
            }
        }
    }
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

const lib = {

    isEmpty,
    cancelError,
    toCsv,

    /**
     * Drop undefined, null and empty-string values (query parameters).
     * @param {object} source
     * @returns {object}
     */
    clean(source = {}) {

        return Object.entries(source).reduce((acc, [key, value]) => {
            if (!isEmpty(value)) {
                acc[key] = value;
            }
            return acc;
        }, {});
    },

    /**
     * A query string from a plain object. An array value is sent as a repeated key
     * (profileIds[]=a&profileIds[]=b). Built here, not by the HTTP client, so that the request is
     * the same string in every environment.
     * @param {object} params
     * @returns {string} '' or '?a=1&b=2'
     */
    toQueryString(params = {}) {

        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(lib.clean(params))) {
            if (Array.isArray(value)) {
                value.forEach(item => search.append(key, String(item)));
            } else {
                search.append(key, String(value));
            }
        }
        const text = search.toString();
        return text ? '?' + text : '';
    },

    /**
     * A numeric ID for a URL path. Anything else is refused so that the value cannot change the
     * path of the request.
     * @param {object} context
     * @param {*} value
     * @param {string} label human readable name for the error message
     * @returns {string} the digits
     */
    requireNumericId(context, value, label) {

        const id = isEmpty(value) ? '' : String(value).trim();
        if (!id) {
            throw cancelError(context, `${label} is required!`);
        }
        if (!/^\d{1,19}$/.test(id)) {
            throw cancelError(context, `${label} must be a number, got "${id}".`);
        }
        return id;
    },

    /**
     * A date-time input as a Date.
     * @param {object} context
     * @param {*} value ISO string, or epoch milliseconds
     * @param {string} label
     * @returns {Date|undefined}
     */
    toDate(context, value, label) {

        if (isEmpty(value)) {
            return undefined;
        }
        const date = new Date(typeof value === 'string' && /^\d{11,}$/.test(value.trim()) ? Number(value) : value);
        if (Number.isNaN(date.getTime())) {
            throw cancelError(context, `${label} is not a valid date: "${value}".`);
        }
        return date;
    },

    /**
     * A whole number input within bounds (it may arrive as a string from a variable).
     * @param {object} context
     * @param {*} value
     * @param {object} options { label, min, max, fallback }
     * @returns {number}
     */
    boundedInteger(context, value, { label, min, max, fallback }) {

        if (isEmpty(value)) {
            return fallback;
        }
        const number = Number(value);
        if (!Number.isInteger(number) || number < min || number > max) {
            throw cancelError(context, `${label} must be a whole number between ${min} and ${max}, got "${value}".`);
        }
        return number;
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
     * Resolve a user supplied endpoint (relative path or absolute URL) against one API origin and
     * refuse anything that would send the account's credential somewhere else. Resolving through
     * the WHATWG URL parser and comparing the origin also rejects protocol-relative input such as
     * "//example.com/x".
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} origin the only origin allowed, e.g. 'https://porter.revinate.com'
     * @param {string} url relative path (e.g. '/hotels') or absolute URL on the API host
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, origin, url) {

        const input = String(url).trim();
        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(input) || input.startsWith('//') || input.startsWith('\\')
            ? input
            : `${input.startsWith('/') ? '' : '/'}${input}`;

        let parsed;
        try {
            parsed = new URL(candidate, origin);
        } catch (error) {
            throw cancelError(context, `API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw cancelError(context, 'API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== origin) {
            throw cancelError(context, `API Endpoint Path must target ${origin}, got ${parsed.origin}.`);
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

        if (isEmpty(value)) {
            return undefined;
        }
        if (typeof value === 'object') {
            return value;
        }
        try {
            return JSON.parse(value);
        } catch (error) {
            throw cancelError(context, `${label} must be valid JSON.`);
        }
    },

    /**
     * Convert a key-value inspector input into a plain object. The Designer stores the rows as the
     * JSON string of an object ('{"Accept":"application/json"}'). A plain object and an array of
     * {key, value} rows (also as a JSON string) are accepted too, for values mapped from a variable.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string|object|Array<{key: string, value: *}>} value
     * @param {string} label human readable input name for the error message
     * @returns {object}
     */
    kvToObject(context, value, label) {

        let input = value;
        if (typeof input === 'string') {
            if (!input.trim()) {
                return {};
            }
            try {
                input = JSON.parse(input);
            } catch (error) {
                throw cancelError(context, `${label} must be a JSON object of key-value pairs.`);
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
     * The user's headers of a Make API Call without the ones the connected account sets. The
     * comparison ignores case, so "authorization" cannot shadow "Authorization".
     * @param {object} headers
     * @param {string[]} reserved header names owned by the connector
     * @returns {object}
     */
    withoutReservedHeaders(headers, reserved) {

        const blocked = reserved.map(name => name.toLowerCase());
        return Object.entries(headers).reduce((acc, [key, value]) => {
            if (!blocked.includes(key.toLowerCase())) {
                acc[key] = value;
            }
            return acc;
        }, {});
    },

    /**
     * Cache the result of fn(). The designer fires source calls in concurrent bursts; the lock lets
     * the first call fill the cache for the rest.
     * @param {object} context
     * @param {object} keyParts every input that shapes the result, the account included
     * @param {Function} fn
     * @returns {Promise<*>}
     */
    async callCached(context, keyParts, fn) {

        const key = 'revinate-' + crypto.createHash('sha256').update(JSON.stringify(keyParts)).digest('hex');
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
    },

    /**
     * Run one trigger check unless the previous one is still running. The engine calls tick()
     * every minute; a check that reads many pages can take longer, and two checks at once would
     * read the same window and send every record twice.
     * @param {object} context
     * @param {Function} fn async () => void
     * @returns {Promise<boolean>} false when the check was skipped
     */
    async runExclusive(context, fn) {

        let lock;
        try {
            lock = await context.lock('revinate-tick-' + context.componentId, { ttl: 5 * 60 * 1000, maxRetryCount: 0 });
        } catch (err) {
            return false;
        }
        try {
            await fn();
            return true;
        } finally {
            await lock.unlock();
        }
    },

    /**
     * The polling body of every Revinate trigger. Neither API has webhooks, both filter by a time
     * range, and neither promises an order that survives paging, so a check reads one closed time
     * window completely instead of diffing "the newest page".
     *
     * State: { initialized, lastTimestamp, lastPollAt, known }.
     * - The first check only stores "now": records that already exist never fire.
     * - A later check reads the window from lastTimestamp - overlapMs to now. The overlap catches a
     *   record that became visible in the API a little after its own timestamp. "known" holds the
     *   keys (with their time) of the records already emitted inside the overlap, so they fire once.
     * - When the window holds more than maxPages pages its new part is halved (its end moves back)
     *   until it fits, and the next check continues from there: a burst takes several checks. Only
     *   when a single second still holds more than maxPages pages are records left out; the caller
     *   is told through "truncated".
     * - Checks closer together than intervalMs are skipped without a request.
     *
     * The state is returned, not saved: the caller saves it after the records were sent.
     * @param {object} context
     * @param {object} options
     * @param {Function} options.fetchPage async (fromMs, toMs, pageIndex) => { records, totalPages }
     * @param {Function} options.getTime (record) => epoch milliseconds, or NaN
     * @param {Function} options.getKey (record) => string that identifies what must fire once
     * @param {number} options.intervalMs
     * @param {number} [options.overlapMs]
     * @param {number} [options.maxPages]
     * @param {number} [options.now] epoch milliseconds (for tests)
     * @returns {Promise<{ emit: Array, state: (object|null), truncated: boolean }>} state null
     *   means "keep the stored state"
     */
    async pollWindow(context, {
        fetchPage, getTime, getKey, intervalMs, overlapMs = 5 * 60 * 1000, maxPages = 10, now = Date.now()
    }) {

        const stored = context.state || {};

        if (!stored.initialized || !Number.isFinite(stored.lastTimestamp)) {
            return {
                emit: [],
                state: { initialized: true, lastTimestamp: now, lastPollAt: now, known: [] },
                truncated: false
            };
        }

        if (Number.isFinite(stored.lastPollAt) && now >= stored.lastPollAt && now - stored.lastPollAt < intervalMs) {
            return { emit: [], state: null, truncated: false };
        }

        const last = stored.lastTimestamp;
        const from = last - overlapMs;
        let to = Math.max(now, last);

        // Halve the new part of the window until everything fits into maxPages. The end never moves
        // back behind lastTimestamp: the overlap was read before and its keys are only remembered
        // from there on. One second is the resolution of the filters.
        let first = await fetchPage(from, to, 0);
        while (first.totalPages > maxPages && to - last > 1000) {
            to = last + Math.max(1000, Math.floor((to - last) / 2));
            first = await fetchPage(from, to, 0);
        }

        const records = [...first.records];
        const pages = Math.min(first.totalPages, maxPages);
        for (let page = 1; page < pages; page++) {
            const next = await fetchPage(from, to, page);
            if (!next.records.length) {
                break;
            }
            records.push(...next.records);
        }

        const timeOf = (record) => {
            const time = getTime(record);
            return Number.isFinite(time) ? time : to;
        };

        const known = new Map(Array.isArray(stored.known) ? stored.known : []);
        const seen = new Set();
        const emit = [];
        for (const record of records) {
            // A record from before the window was not asked for. Should the API ever ignore the
            // time filter, old records must not fire as new on every check.
            const time = getTime(record);
            if (Number.isFinite(time) && time < from) {
                continue;
            }
            const key = getKey(record);
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            if (!known.has(key)) {
                emit.push(record);
            }
            known.set(key, timeOf(record));
        }
        emit.sort((a, b) => timeOf(a) - timeOf(b));

        // Only what the next window can return again has to be remembered.
        const nextFrom = to - overlapMs;
        const nextKnown = [...known.entries()].filter(([, time]) => time >= nextFrom);

        return {
            emit,
            state: { initialized: true, lastTimestamp: to, lastPollAt: now, known: nextKnown },
            truncated: first.totalPages > maxPages
        };
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
                    const { title, ...schemaWithoutTitle } = schema;
                    res.push({ label: title, value: field, schema: schemaWithoutTitle });
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

module.exports = lib;
