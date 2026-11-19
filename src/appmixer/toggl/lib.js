'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Toggl API (the product formerly called Toggl Focus / Toggl 2.0):
// https://engineering.toggl.com/docs/focus/
const API_ORIGIN = 'https://focus.toggl.com';
const API_BASE_URL = `${API_ORIGIN}/api`;

const DEFAULT_PREFIX = 'toggl-objects-export';

// The default workspace of the account rarely changes; caching it saves one request per run
// (the Free plan allows 30 requests per hour).
const SCOPE_TTL = 10 * 60 * 1000;

// Polling triggers check Toggl at most this often, to stay within the hourly quota.
const POLL_INTERVAL = 5 * 60 * 1000;
// Time entries are listed by the time they cover: the triggers watch entries of this window.
const POLL_WINDOW_BACK = 30 * 24 * 60 * 60 * 1000;
const POLL_WINDOW_AHEAD = 24 * 60 * 60 * 1000;

// Largest page of the list endpoints.
const PAGE_SIZE = 100;
// Upper bound of what Find/List components read: 10 pages.
const MAX_PAGES = 10;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

const authHeaders = (apiKey) => {

    // A pasted key often carries a trailing space or newline.
    return { 'Authorization': `Bearer ${String(apiKey || '').trim()}` };
};

/**
 * context.httpRequest with the Toggl credential, a retry on 429 and a readable error for
 * 402 (hourly quota used up, or a feature of a paid plan).
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
                    ...authHeaders(context.auth.apiKey)
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
                const body = err.response.data;
                const detail = typeof body === 'string' ? body : JSON.stringify(body || '');
                throw new context.CancelError(
                    'Toggl refused the request with 402: the hourly API quota of the plan is used up, ' +
                    'or the feature needs a paid plan. ' + detail
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
 * Every endpoint is addressed by organization and workspace. They come from the connected
 * account when it names them, otherwise from the account's default workspace
 * (GET /users/me/landing-workspace, cached).
 */
const resolveScope = async (context) => {

    const { organizationId, workspaceId } = context.auth;
    if (organizationId && workspaceId) {
        return {
            organizationId: requireId(context, organizationId, 'Organization ID'),
            workspaceId: requireId(context, workspaceId, 'Workspace ID')
        };
    }

    // The cache only saves a request: without it the default workspace is looked up each time.
    const key = `toggl-scope-${hash({ key: context.auth.apiKey })}`;
    let cached;
    try {
        cached = await context.staticCache.get(key);
    } catch (err) {
        cached = null;
    }
    if (cached && cached.organizationId && cached.workspaceId) {
        return cached;
    }
    const { data } = await request(context, { method: 'GET', url: `${API_BASE_URL}/users/me/landing-workspace` });
    if (!data || !data.organization_id || !data.workspace_id) {
        throw new context.CancelError(
            'The Toggl account has no workspace it can open. Reconnect the account with an Organization ID and a Workspace ID.'
        );
    }
    const scope = { organizationId: String(data.organization_id), workspaceId: String(data.workspace_id) };
    try {
        await context.staticCache.set(key, scope, SCOPE_TTL);
    } catch (err) {
        // Not cached; the next run asks again.
    }
    return scope;
};

/**
 * Base URLs of the two path families: most resources live under the organization and the
 * workspace, clients, tags and reports under the workspace only.
 */
const urls = async (context) => {

    const { organizationId, workspaceId } = await resolveScope(context);
    return {
        organizationId,
        workspaceId,
        workspace: `${API_BASE_URL}/organizations/${organizationId}/workspaces/${workspaceId}`,
        workspaceOnly: `${API_BASE_URL}/workspaces/${workspaceId}`,
        reports: `${API_BASE_URL}/reports/workspaces/${workspaceId}`
    };
};

/**
 * RFC 3339 time in UTC.
 */
const toTogglTime = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new context.CancelError(`${label} is not a valid date: ${value}`);
    }
    return date.toISOString();
};

/**
 * Calendar date (YYYY-MM-DD) for the reports. A value that already is a date is kept as
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
 * A text input that takes a comma-separated list of IDs, or an array from a variable.
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
 * Drop the keys Toggl sends as null, so an output field is either present with a value of
 * its type or absent.
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
 * A time entry as the components emit it. Toggl stores start and duration; `stop` is added
 * for a finished entry. A running timer has neither duration nor stop.
 */
const TIME_ENTRY_FIELDS = [
    'id', 'workspace_id', 'project_id', 'task_id', 'toggl_user_id', 'type', 'description', 'start',
    'duration', 'billable', 'tag_ids', 'timezone', 'created_at', 'updated_at'
];

const toTimeEntry = (entry) => {

    const picked = {};
    for (const field of TIME_ENTRY_FIELDS) {
        picked[field] = (entry || {})[field];
    }
    const result = withoutNulls(picked);
    if (result.start && Number.isFinite(result.duration)) {
        const start = new Date(result.start).getTime();
        if (!isNaN(start)) {
            result.stop = new Date(start + result.duration * 1000).toISOString();
        }
    }
    return result;
};

/**
 * Read a paged list ({ data, page, per_page }) page by page, up to MAX_PAGES pages.
 * `done` gets each page and ends the reading early when it returns true.
 */
const listAll = async (context, url, params = {}, { maxPages = MAX_PAGES, done } = {}) => {

    const records = [];
    for (let page = 1; page <= maxPages; page++) {
        const { data } = await request(context, {
            method: 'GET',
            url,
            params: { ...params, page, per_page: PAGE_SIZE }
        });
        const items = data && Array.isArray(data.data) ? data.data : [];
        records.push(...items);
        if (items.length < PAGE_SIZE || (done && done(items))) {
            break;
        }
    }
    return records;
};

/**
 * Paging of a polling trigger over a list sorted newest first by `field`. Without `since`
 * (the baseline, Flow Test Mode) one page is enough. With it, pages are read until one holds
 * a record older than `since`, so a bulk import or a bulk edit of more than a page between
 * two checks is emitted whole. MAX_PAGES still bounds the reading (1,000 records per check).
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
 * Cached list for inspector sources: the designer calls them in bursts when an inspector opens.
 */
const listAllCached = async (context, url, params) => {

    let lock;
    try {
        const key = `toggl-source-${hash({ url, params, key: context.auth.apiKey })}`;
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const records = await listAll(context, url, params);
        await context.staticCache.set(key, records, context.config.listCacheTTL || (2 * 60 * 1000));
        return records;
    } finally {
        lock?.unlock();
    }
};

/**
 * The caller's own time entries that overlap [from, to], tasks or not. The API returns only
 * the entries of the connected user; other members' time is in the reports.
 */
const listTimeEntries = async (context, { from, to, projectId, orderBy = '-start', maxPages, done } = {}) => {

    const { workspace } = await urls(context);
    const params = {
        date_from: from,
        date_to: to,
        include_taskless: true,
        order_by: orderBy
    };
    if (projectId) {
        params.project_id = projectId;
    }
    const entries = await listAll(context, `${workspace}/time-entries`, params, { maxPages, done });
    return entries.map(toTimeEntry);
};

const toProject = project => withoutNulls({
    id: project.id,
    workspace_id: project.workspace_id,
    client_id: project.client_id,
    name: project.name,
    description: project.description,
    private: project.private,
    billable: project.billable,
    color: project.color,
    archived_at: project.archived_at,
    completed_at: project.completed_at,
    created_at: project.created_at,
    updated_at: project.updated_at
});

/**
 * Projects of the workspace, archived and completed ones included (an empty `archived` and
 * `completed` parameter means "all"; omitting them hides archived and completed projects).
 * It lives here, not in List Projects: the engine loads each component from its own versioned
 * directory, so one component cannot require another.
 */
const fetchProjects = async (context, { cached = false, orderBy = 'name', maxPages, done } = {}) => {

    const { workspace } = await urls(context);
    const url = `${workspace}/projects`;
    const params = { archived: '', completed: '', order_by: orderBy };
    const projects = cached
        ? await listAllCached(context, url, params)
        : await listAll(context, url, params, { maxPages, done });
    return projects.map(toProject);
};

const pollWindow = (now = Date.now()) => ({
    from: new Date(now - POLL_WINDOW_BACK).toISOString(),
    to: new Date(now + POLL_WINDOW_AHEAD).toISOString()
});

/**
 * Shared body of the polling triggers. `fetch(since)` returns the records by `field`
 * (a timestamp), newest first, back to the timestamp `since` (see pagesSince); `since` is
 * undefined on the first run. State: { initialized, lastTimestamp, known, lastPoll }.
 *   - `initialized` is kept apart from `lastTimestamp`, so the first record of an empty
 *     account is not swallowed by a second baseline.
 *   - A record is emitted when its timestamp is newer than the last one seen, or equal to it
 *     and its ID is not among the `known` IDs of that boundary timestamp.
 *   - `accept` drops records the trigger does not report (e.g. an update that is the creation).
 */
const pollByTimestamp = async (context, { fetch, field, accept }) => {

    const now = Date.now();
    const state = context.state || {};
    if (state.lastPoll && now - state.lastPoll < POLL_INTERVAL) {
        return;
    }

    let lock;
    try {
        lock = await context.lock(context.componentId, { ttl: 2 * 60 * 1000, maxRetryCount: 0 });
    } catch (err) {
        // Another tick is still running.
        return;
    }

    try {
        const since = state.initialized ? (state.lastTimestamp || 0) : undefined;
        const records = (await fetch(since)).filter(record => record && record[field]);
        const time = record => new Date(record[field]).getTime();

        const newest = records.reduce((max, record) => Math.max(max, time(record)), 0);
        const lastTimestamp = state.lastTimestamp || 0;
        const boundary = Math.max(newest, lastTimestamp);
        const knownAtBoundary = records.filter(record => time(record) === boundary).map(record => String(record.id));

        if (!state.initialized) {
            // First run: remember where the account stands, emit nothing.
            return await context.saveState({
                initialized: true,
                lastTimestamp: boundary,
                known: knownAtBoundary,
                lastPoll: now
            });
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
            // IDs sharing the boundary timestamp, so a record written in the same instant
            // is neither skipped nor emitted twice.
            known: boundary === lastTimestamp ? [...new Set([...known, ...knownAtBoundary])] : knownAtBoundary,
            lastPoll: now
        });
    } finally {
        lock?.unlock();
    }
};

module.exports = {

    API_ORIGIN,
    API_BASE_URL,
    PAGE_SIZE,
    MAX_PAGES,

    authHeaders,
    request,
    requireId,
    optionalId,
    resolveScope,
    urls,
    toTogglTime,
    toDateOnly,
    splitList,
    idList,
    withoutNulls,
    toTimeEntry,
    listAll,
    listAllCached,
    listTimeEntries,
    fetchProjects,
    pollWindow,
    pagesSince,
    pollByTimestamp,

    /**
     * Resolve a MakeApiCall URL. A relative path is resolved against the Toggl API
     * (https://focus.toggl.com/api); a full URL is accepted only on https://focus.toggl.com,
     * so the API key is never sent to another host.
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
    // a different key order or a missing key stays under the right header. The columns
    // are the keys of all records: withoutNulls() drops absent fields, so the first
    // record (a running timer has no duration and no stop) does not name them all.
    const columns = [...new Set(records.flatMap(record => Object.keys(record)))];
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};
