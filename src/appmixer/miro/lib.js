'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Miro REST API v2 (https://developers.miro.com/reference/overview). The OAuth token endpoint and
// the token-context endpoint live under /v1 on the same host and are not deprecated.
const API_ORIGIN = 'https://api.miro.com';
const API_BASE_URL = API_ORIGIN + '/v2';

// Scopes of the REST API used by the components (https://developers.miro.com/reference/scopes).
const SCOPES = ['boards:read', 'boards:write'];

// GET /v2/boards returns at most 50 boards per page, GET /v2/boards/{id}/items 50 items (minimum 10).
const BOARDS_PAGE_SIZE = 50;
const ITEMS_PAGE_SIZE = 50;

// How far a trigger walks back per check: 10 pages of boards (500), 40 pages of items (2000).
const MAX_BOARD_PAGES = 10;
const MAX_ITEM_PAGES = 40;

// Rate limits are counted in credits per user and app; a 429 answer is retried after a short wait.
const MAX_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 10 * 1000;

const DEFAULT_PREFIX = 'miro-objects-export';

// HTTP statuses that retrying cannot fix (bad input, missing permission or plan, not found, conflict).
const CANCEL_STATUSES = [400, 403, 404, 409, 410, 413, 422];

const cancelError = (context, message) => {

    return context.CancelError ? new context.CancelError(message) : new Error(message);
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * The one place that turns a connected account into request headers.
 * Components read the token from context.auth, auth.js callbacks from context.accessToken.
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    const token = context.auth && context.auth.accessToken ? context.auth.accessToken : context.accessToken;
    return { 'Authorization': 'Bearer ' + token };
};

const header = (headers, name) => {

    if (!headers) {
        return undefined;
    }
    return headers[name] !== undefined ? headers[name] : headers[name.toLowerCase()];
};

/**
 * How long to wait before retrying a 429 answer: Retry-After (seconds), or until X-RateLimit-Reset
 * (UNIX seconds), capped; one second when the answer names neither.
 * @param {object} headers
 * @returns {number} milliseconds
 */
const retryDelay = (headers) => {

    const retryAfter = Number(header(headers, 'Retry-After'));
    if (Number.isFinite(retryAfter) && retryAfter >= 0) {
        return Math.min(retryAfter * 1000, MAX_RETRY_WAIT_MS);
    }
    const reset = Number(header(headers, 'X-RateLimit-Reset'));
    if (Number.isFinite(reset) && reset > 0) {
        return Math.min(Math.max(reset * 1000 - Date.now(), 0), MAX_RETRY_WAIT_MS);
    }
    return 1000;
};

/**
 * Turn an HTTP error into an error with Miro's message ({ status, code, message, type: "error" }).
 * Errors retrying cannot fix become CancelError.
 * @param {object} context
 * @param {Error} err
 * @returns {Error}
 */
const toApiError = (context, err) => {

    const response = err && err.response;
    if (!response) {
        return err;
    }
    const body = response.data && typeof response.data === 'object' ? response.data : {};
    const code = body.code ? ', ' + body.code : '';
    const message = 'Miro API error (HTTP ' + response.status + code + '): ' +
        (body.message || response.statusText || err.message);
    const error = CANCEL_STATUSES.includes(response.status) ? cancelError(context, message) : new Error(message);
    error.response = { status: response.status, data: response.data, headers: response.headers };
    return error;
};

/**
 * Call the Miro REST API with the connected account.
 * @param {object} context
 * @param {object} options { method, path, params, data, url } path is relative to /v2, url is absolute
 * @returns {Promise<*>} the response body
 */
const request = async (context, { method = 'GET', path, params, data, url }) => {

    const options = {
        method,
        url: url || API_BASE_URL + path,
        headers: authHeaders(context)
    };
    if (params && Object.keys(params).length) {
        options.params = params;
    }
    if (data !== undefined) {
        options.data = data;
    }

    for (let attempt = 0; ; attempt++) {
        try {
            const response = await context.httpRequest(options);
            return response.data;
        } catch (err) {
            const response = err && err.response;
            if (response && response.status === 429 && attempt < MAX_RETRIES) {
                await sleep(retryDelay(response.headers));
                continue;
            }
            throw toApiError(context, err);
        }
    }
};

/**
 * An ID for a URL path: trimmed and encoded, so it cannot change the path.
 * @param {object} context
 * @param {*} value
 * @param {string} label human readable name for the error message
 * @returns {string}
 */
const requireId = (context, value, label) => {

    const id = value === undefined || value === null ? '' : String(value).trim();
    if (!id) {
        throw cancelError(context, label + ' is required!');
    }
    return encodeURIComponent(id);
};

const getProfileInfo = (context) => {

    return (context.auth && context.auth.profileInfo) || context.profileInfo || {};
};

/**
 * Who the token belongs to: GET /v1/oauth-token (user, team, organization, scopes).
 * @param {object} context
 * @returns {Promise<object>}
 */
const getTokenContext = async (context) => {

    return request(context, { url: API_ORIGIN + '/v1/oauth-token' });
};

const getCacheKey = (obj) => {

    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
};

/**
 * Cache the result of fn(). The designer fires source calls in concurrent bursts; the lock lets
 * the first call fill the cache for the rest.
 * @param {object} context
 * @param {object} keyParts every input that shapes the result
 * @param {Function} fn
 * @param {number} [ttl]
 * @returns {Promise<*>}
 */
const callCached = async (context, keyParts, fn, ttl) => {

    const key = 'miro-' + getCacheKey({ ...keyParts, token: context.auth.accessToken });
    let lock;
    try {
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const value = await fn();
        await context.staticCache.set(key, value, ttl || context.config.listCacheTTL || (2 * 60 * 1000));
        return value;
    } finally {
        lock && await lock.unlock();
    }
};

/**
 * The team the account was connected to (the token response names it), or the team of the token.
 * @param {object} context
 * @returns {Promise<string>}
 */
const defaultTeamId = async (context) => {

    const { teamId } = getProfileInfo(context);
    if (teamId) {
        return String(teamId);
    }
    const tokenContext = await callCached(context, { op: 'token-context' }, () => getTokenContext(context), 30 * 60 * 1000);
    const id = tokenContext && tokenContext.team && tokenContext.team.id;
    if (!id) {
        throw new Error('Could not determine the Miro team of the connected account.');
    }
    return String(id);
};

// Boards ------------------------------------------------------------------------------------

/**
 * One page of boards (GET /v2/boards).
 * @param {object} context
 * @param {object} filter { teamId, projectId, query, owner, sort, offset, limit }
 * @returns {Promise<{boards: object[], total: number}>}
 */
const listBoardsPage = async (context, filter = {}) => {

    const { teamId, projectId, query, owner, sort, offset, limit = BOARDS_PAGE_SIZE } = filter;
    const params = { limit: String(limit) };
    if (teamId) params.team_id = teamId;
    if (projectId) params.project_id = projectId;
    if (query) params.query = query;
    if (owner) params.owner = owner;
    if (sort) params.sort = sort;
    if (offset) params.offset = String(offset);

    const body = await request(context, { path: '/boards', params });
    const boards = (body && body.data) || [];
    const total = body && Number.isFinite(body.total) ? body.total : boards.length;
    return { boards, total };
};

/**
 * Boards of a team, newest first by a timestamp field, from the first page back to `since`
 * (or one page when `since` is not given).
 * @param {object} context
 * @param {object} options { teamId, sort, field, since }
 * @returns {Promise<object[]>}
 */
const fetchBoardsSince = async (context, { teamId, sort, field, since }) => {

    const result = [];
    for (let page = 0; page < MAX_BOARD_PAGES; page++) {
        const { boards, total } = await listBoardsPage(context, { teamId, sort, offset: page * BOARDS_PAGE_SIZE });
        result.push(...boards);
        const oldest = boards[boards.length - 1];
        const reachedSince = since === undefined || !oldest || new Date(oldest[field]).getTime() < since;
        const lastPage = boards.length < BOARDS_PAGE_SIZE || result.length >= total;
        if (reachedSince || lastPage) {
            break;
        }
    }
    return result;
};

// Items -------------------------------------------------------------------------------------

/**
 * One page of the items of a board (GET /v2/boards/{board_id}/items, cursor paging).
 * @param {object} context
 * @param {string} boardId encoded board ID
 * @param {object} options { type, cursor, limit }
 * @returns {Promise<{items: object[], cursor: string|undefined}>}
 */
const listItemsPage = async (context, boardId, { type, cursor, limit = ITEMS_PAGE_SIZE } = {}) => {

    const params = { limit: String(limit) };
    if (type) params.type = type;
    if (cursor) params.cursor = cursor;

    const body = await request(context, { path: '/boards/' + boardId + '/items', params });
    return { items: (body && body.data) || [], cursor: (body && body.cursor) || undefined };
};

/**
 * All items of a board (up to MAX_ITEM_PAGES pages). The API has no sort order for items.
 * @param {object} context
 * @param {string} boardId encoded board ID
 * @param {object} options { type }
 * @returns {Promise<{items: object[], complete: boolean}>}
 */
const listAllItems = async (context, boardId, { type } = {}) => {

    const items = [];
    let cursor;
    for (let page = 0; page < MAX_ITEM_PAGES; page++) {
        const result = await listItemsPage(context, boardId, { type, cursor });
        items.push(...result.items);
        cursor = result.cursor;
        if (!cursor || !result.items.length) {
            return { items, complete: true };
        }
    }
    return { items, complete: false };
};

// Polling -----------------------------------------------------------------------------------

/**
 * Emit the records whose timestamp `field` is newer than the stored watermark.
 * The first run only stores where the account stands. IDs sharing the watermark are kept so a
 * record written in the same instant is neither skipped nor emitted twice. An empty answer while
 * records are known keeps the state (a degraded answer must not reset the watermark).
 * @param {object} context
 * @param {object} options { fetch(since) → records, field, accept(record) }
 */
const pollByTimestamp = async (context, { fetch, field, accept }) => {

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
        const records = (await fetch(since)).filter(record => record && record.id && record[field]);
        const time = record => new Date(record[field]).getTime();

        if (state.initialized && state.lastTimestamp && !records.length) {
            return;
        }

        const newest = records.reduce((max, record) => Math.max(max, time(record)), 0);
        const lastTimestamp = state.lastTimestamp || 0;
        const boundary = Math.max(newest, lastTimestamp);
        const knownAtBoundary = records.filter(record => time(record) === boundary).map(record => String(record.id));

        if (!state.initialized) {
            // First run: remember where the account stands, emit nothing.
            return await context.saveState({ initialized: true, lastTimestamp: boundary, known: knownAtBoundary });
        }

        const known = new Set((state.known || []).map(String));
        const fresh = records
            .filter(record => time(record) > lastTimestamp
                || (time(record) === lastTimestamp && !known.has(String(record.id))))
            .filter(record => !accept || accept(record))
            .sort((a, b) => time(a) - time(b));

        for (const record of fresh) {
            await context.sendJson(record, 'out');
        }

        await context.saveState({
            initialized: true,
            lastTimestamp: boundary,
            known: boundary === lastTimestamp ? [...new Set([...known, ...knownAtBoundary])] : knownAtBoundary
        });
    } finally {
        lock && await lock.unlock();
    }
};

// Input helpers -----------------------------------------------------------------------------

/**
 * A number input, or undefined when empty.
 * @param {object} context
 * @param {*} value
 * @param {string} label
 * @returns {number|undefined}
 */
const toNumber = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
        throw cancelError(context, label + ' must be a number.');
    }
    return number;
};

/**
 * A comma or newline separated text input as a list of trimmed, non-empty values.
 * @param {string|string[]} value
 * @returns {string[]}
 */
const splitList = (value) => {

    if (value === undefined || value === null) {
        return [];
    }
    const list = Array.isArray(value) ? value : String(value).split(/[,\n]/);
    return list.map(item => String(item).trim()).filter(item => item.length > 0);
};

/**
 * Drop undefined, null and empty-string values, and empty nested objects.
 * @param {object} obj
 * @returns {object}
 */
const compact = (obj) => {

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
            const nested = compact(value);
            if (Object.keys(nested).length) {
                result[key] = nested;
            }
            continue;
        }
        result[key] = value;
    }
    return result;
};

/**
 * Position, geometry and parent of a new item, from the common inputs.
 * @param {object} context
 * @param {object} input { x, y, width, height, parentId }
 * @returns {object}
 */
const placement = (context, { x, y, width, height, parentId }) => {

    return compact({
        position: { x: toNumber(context, x, 'X'), y: toNumber(context, y, 'Y') },
        geometry: { width: toNumber(context, width, 'Width'), height: toNumber(context, height, 'Height') },
        parent: { id: parentId ? String(parentId).trim() : undefined }
    });
};

// MakeApiCall helpers -----------------------------------------------------------------------

/**
 * Resolve a user supplied endpoint (relative path or absolute URL) against https://api.miro.com
 * and refuse anything that would send the account's credential somewhere else.
 * @param {object} context
 * @param {string} url
 * @returns {string}
 */
const resolveApiUrl = (context, url) => {

    const value = String(url).trim();
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')
        ? value
        : (value.startsWith('/') ? '' : '/') + value;

    let parsed;
    try {
        parsed = new URL(candidate, API_ORIGIN);
    } catch (error) {
        throw new context.CancelError('API Endpoint Path is not a valid URL: ' + url);
    }

    if (parsed.username || parsed.password) {
        throw new context.CancelError('API Endpoint Path must not contain credentials.');
    }

    if (parsed.origin !== API_ORIGIN) {
        throw new context.CancelError('API Endpoint Path must target ' + API_ORIGIN + ', got ' + parsed.origin + '.');
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
};

// outputType helpers ------------------------------------------------------------------------

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

    API_ORIGIN,
    API_BASE_URL,
    SCOPES,
    BOARDS_PAGE_SIZE,
    ITEMS_PAGE_SIZE,
    MAX_BOARD_PAGES,
    MAX_ITEM_PAGES,

    authHeaders,
    retryDelay,
    toApiError,
    request,
    requireId,
    getProfileInfo,
    getTokenContext,
    callCached,
    defaultTeamId,
    listBoardsPage,
    fetchBoardsSince,
    listItemsPage,
    listAllItems,
    pollByTimestamp,
    toNumber,
    splitList,
    compact,
    placement,
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
            // sendArrayOutput() emits { result, count } in array mode, so both are offered.
            return context.sendJson([{
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }, {
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
