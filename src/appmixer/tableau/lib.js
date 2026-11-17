'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Tableau Server 2023.1 speaks 3.19; Tableau Cloud and newer servers accept older versions too.
// A server rejects a version newer than its own, so the connector pins a conservative one.
const API_VERSION = '3.19';

// The Cloud credentials token lives 120 minutes (30 minutes idle per the UAT docs), the Server one
// 240 minutes idle. A cached session older than this is signed in again before it is used.
const SESSION_TTL_MS = 25 * 60 * 1000;

const DEFAULT_PREFIX = 'tableau-objects-export';

const SITE_CONTENT_URL_PATTERN = /^[A-Za-z0-9_-]*$/;

/**
 * The origin of the Tableau Cloud pod or Tableau Server the user typed. The PAT secret and the
 * session token are sent to it, so only an https URL without credentials is accepted, and only its
 * origin is used. Checked as typed: components build their URLs from the stored value.
 * @param {string} serverUrl
 * @returns {string} origin, e.g. https://10ay.online.tableau.com
 */
function serverOrigin(serverUrl) {

    let parsed;
    try {
        parsed = new URL(String(serverUrl || '').trim());
    } catch (err) {
        throw new Error('Invalid Server URL. Enter the URL you open Tableau at, e.g. https://10ay.online.tableau.com.');
    }
    if (parsed.protocol !== 'https:') {
        throw new Error('Invalid Server URL. Only https URLs are supported.');
    }
    if (parsed.username || parsed.password) {
        throw new Error('Invalid Server URL. The URL must not contain a user name or password.');
    }
    return parsed.origin;
}

function siteContentUrl(value) {

    const contentUrl = typeof value === 'string' ? value.trim() : '';
    if (!SITE_CONTENT_URL_PATTERN.test(contentUrl)) {
        throw new Error('Invalid Site. Enter the site name from the browser URL after /site/, e.g. "mysite".');
    }
    return contentUrl;
}

function tableauErrorMessage(err) {

    let body = err && err.response && err.response.data;
    if (body && (Buffer.isBuffer(body) || body instanceof ArrayBuffer)) {
        try {
            body = JSON.parse(Buffer.from(body).toString('utf8'));
        } catch (e) {
            body = null;
        }
    }
    const error = body && body.error;
    if (error && (error.summary || error.detail)) {
        const status = err.response.status;
        return 'Tableau API error ' + status + (error.code ? ' (' + error.code + ')' : '') + ': '
            + [error.summary, error.detail].filter(Boolean).join(' - ');
    }
    return null;
}

/**
 * Sign in with the Personal Access Token. Used by auth.js and by the session cache.
 * @param {object} context any context that has httpRequest
 * @param {object} auth { serverUrl, siteContentUrl, tokenName, tokenSecret }
 */
async function signIn(context, auth) {

    const origin = serverOrigin(auth.serverUrl);
    const contentUrl = siteContentUrl(auth.siteContentUrl);
    let response;
    try {
        response = await context.httpRequest({
            method: 'POST',
            url: origin + '/api/' + API_VERSION + '/auth/signin',
            headers: { 'Accept': 'application/json' },
            data: {
                credentials: {
                    personalAccessTokenName: auth.tokenName,
                    personalAccessTokenSecret: auth.tokenSecret,
                    site: { contentUrl }
                }
            }
        });
    } catch (err) {
        const message = tableauErrorMessage(err);
        if (err.response && err.response.status === 401) {
            throw new Error((message || 'Tableau rejected the sign-in.')
                + ' Check the token name, the token secret and the site. Personal access tokens expire after 15 days'
                + ' without use, and on Tableau Cloud a site administrator must enable them.');
        }
        throw message ? new Error(message) : err;
    }
    const credentials = (response.data || {}).credentials || {};
    if (!credentials.token || !credentials.site || !credentials.site.id) {
        throw new Error('Tableau sign-in returned no credentials token.');
    }
    return {
        token: credentials.token,
        siteId: credentials.site.id,
        siteContentUrl: credentials.site.contentUrl || '',
        userId: credentials.user && credentials.user.id,
        estimatedTimeToExpiration: credentials.estimatedTimeToExpiration
    };
}

function sessionKey(auth) {

    const hash = crypto.createHash('sha256')
        .update(JSON.stringify([auth.serverUrl, auth.siteContentUrl, auth.tokenName, auth.tokenSecret]))
        .digest('hex');
    return 'tableau-session-' + hash;
}

/**
 * One cached session per connected account, shared by every component of the account.
 * Each sign-in with a PAT ends the previous session of the same PAT, so components must not sign in
 * per request: the session is cached and a new sign-in happens under a lock, once.
 * @param {object} context component context
 * @param {string} [staleToken] the token a request was rejected with; forces a new sign-in unless
 *  another component already replaced it
 */
async function getSession(context, staleToken) {

    const key = sessionKey(context.auth);
    if (!staleToken) {
        const cached = await context.staticCache.get(key);
        if (cached && cached.token) {
            return cached;
        }
    }
    let lock;
    try {
        lock = await context.lock(key, { ttl: 30000, retryDelay: 500, maxRetryCount: 60 });
        const cached = await context.staticCache.get(key);
        if (cached && cached.token && cached.token !== staleToken) {
            return cached;
        }
        const session = await signIn(context, context.auth);
        await context.staticCache.set(key, session, SESSION_TTL_MS);
        return session;
    } finally {
        if (lock) {
            await lock.unlock();
        }
    }
}

function siteUrl(context, session, path) {

    return serverOrigin(context.auth.serverUrl) + '/api/' + API_VERSION + '/sites/' + session.siteId + path;
}

/**
 * Authorized request to a site-scoped endpoint; "path" is relative to /api/{version}/sites/{site-id}.
 * Signs in again once when the session was ended (401), e.g. by another sign-in with the same PAT.
 */
async function apiRequest(context, { method = 'GET', path, params, data, headers = {}, responseType }) {

    const send = async (session) => context.httpRequest({
        method,
        url: siteUrl(context, session, path),
        headers: { 'Accept': 'application/json', ...headers, 'X-Tableau-Auth': session.token },
        params,
        data,
        responseType
    });

    let session = await getSession(context);
    try {
        try {
            return await send(session);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                session = await getSession(context, session.token);
                return await send(session);
            }
            throw err;
        }
    } catch (err) {
        const message = tableauErrorMessage(err);
        if (message) {
            const error = new Error(message);
            error.response = err.response;
            throw error;
        }
        throw err;
    }
}

function encodeId(value) {

    return encodeURIComponent(String(value).trim());
}

/**
 * A filter value cannot contain "," or "&", not even encoded (Tableau filtering docs).
 */
function filterValue(context, value, label) {

    const text = String(value).trim();
    if (/[,&]/.test(text)) {
        throw new context.CancelError(label + ' must not contain "," or "&" (a Tableau filter limitation).');
    }
    return text;
}

function toTableauDate(value) {

    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Builds the "filter" query parameter from [field, operator, value, label] rows; empty values are skipped.
 */
function buildFilter(context, rows) {

    const parts = [];
    for (const [field, operator, value, label] of rows) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        if (operator === 'gte' || operator === 'gt' || operator === 'lte' || operator === 'lt') {
            const date = toTableauDate(value);
            if (!date) {
                throw new context.CancelError(label + ' is not a valid date.');
            }
            parts.push(field + ':' + operator + ':' + date);
        } else {
            parts.push(field + ':' + operator + ':' + filterValue(context, value, label));
        }
    }
    return parts.length ? parts.join(',') : undefined;
}

/**
 * Tableau JSON wraps lists as { workbooks: { workbook: [...] } }; a single item may come unwrapped.
 */
function toList(container, key) {

    if (!container) return [];
    if (Array.isArray(container)) return container;
    const value = container[key];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function toBool(value) {

    return value === true || value === 'true';
}

function toInt(value) {

    if (value === undefined || value === null || value === '') return undefined;
    const number = Number(value);
    return isNaN(number) ? undefined : number;
}

function tagsOf(item) {

    return toList(item.tags, 'tag').map(tag => tag.label).filter(Boolean);
}

function pick(object) {

    return Object.keys(object).reduce((result, key) => {
        if (object[key] !== undefined) {
            result[key] = object[key];
        }
        return result;
    }, {});
}

function mapWorkbook(w = {}) {

    return pick({
        id: w.id,
        name: w.name,
        description: w.description,
        contentUrl: w.contentUrl,
        webpageUrl: w.webpageUrl,
        showTabs: w.showTabs === undefined ? undefined : toBool(w.showTabs),
        size: toInt(w.size),
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        defaultViewId: w.defaultViewId,
        projectId: w.project && w.project.id,
        projectName: w.project && w.project.name,
        ownerId: w.owner && w.owner.id,
        ownerName: w.owner && w.owner.name,
        tags: tagsOf(w)
    });
}

function mapView(v = {}) {

    return pick({
        id: v.id,
        name: v.name,
        contentUrl: v.contentUrl,
        viewUrlName: v.viewUrlName,
        sheetType: v.sheetType,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        workbookId: v.workbook && v.workbook.id,
        ownerId: v.owner && v.owner.id,
        projectId: v.project && v.project.id,
        tags: tagsOf(v)
    });
}

function mapDataSource(d = {}) {

    return pick({
        id: d.id,
        name: d.name,
        description: d.description,
        contentUrl: d.contentUrl,
        type: d.type,
        webpageUrl: d.webpageUrl,
        isCertified: d.isCertified === undefined ? undefined : toBool(d.isCertified),
        certificationNote: d.certificationNote,
        hasExtracts: d.hasExtracts === undefined ? undefined : toBool(d.hasExtracts),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        projectId: d.project && d.project.id,
        projectName: d.project && d.project.name,
        ownerId: d.owner && d.owner.id,
        tags: tagsOf(d)
    });
}

function mapUser(u = {}) {

    return pick({
        id: u.id,
        name: u.name,
        fullName: u.fullName,
        email: u.email,
        siteRole: u.siteRole,
        authSetting: u.authSetting,
        lastLogin: u.lastLogin,
        externalAuthUserId: u.externalAuthUserId,
        locale: u.locale,
        language: u.language
    });
}

function mapGroup(g = {}) {

    return pick({
        id: g.id,
        name: g.name,
        domainName: g.domain && g.domain.name,
        minimumSiteRole: g.minimumSiteRole || (g.import && g.import.siteRole)
    });
}

const FINISH_STATUS = { 0: 'Success', 1: 'Failed', 2: 'Cancelled' };

/**
 * A job is finished when it has a completion time (the Tableau Server Client waits the same way);
 * finishCode is then 0 success, 1 error, 2 cancelled.
 */
function mapJob(j = {}) {

    const finishCode = toInt(j.finishCode);
    const finished = Boolean(j.completedAt);
    const refresh = j.extractRefreshJob || {};
    const notes = toList(j.statusNotes, 'statusNote').map(note => note.text).filter(Boolean);
    return pick({
        id: j.id,
        type: j.type,
        mode: j.mode,
        progress: toInt(j.progress),
        finishCode,
        status: finished ? (FINISH_STATUS[finishCode] || 'Unknown') : 'InProgress',
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        completedAt: j.completedAt,
        workbookId: refresh.workbook && refresh.workbook.id,
        workbookName: refresh.workbook && refresh.workbook.name,
        datasourceId: refresh.datasource && refresh.datasource.id,
        datasourceName: refresh.datasource && refresh.datasource.name,
        notes: notes.length ? notes.join(' ') : undefined
    });
}

function isJobFinished(job) {

    return job.status !== 'InProgress';
}

// Appmixer does not schedule a continuation sooner than one minute, so that is the poll interval.
const JOB_POLL_INTERVAL_MS = 60 * 1000;
const DEFAULT_JOB_TIMEOUT_MINUTES = 120;

/**
 * Waits for a job that Tableau just accepted (refresh, run now): schedules a continuation that checks
 * the job once a minute until it finishes or the timeout passes. The scheduled message keeps the
 * scope of the input message, so the result continues the branch that started the job.
 */
async function waitForJob(context, job, timeoutMinutes) {

    const jobId = job && job.id;
    if (!jobId) {
        throw new context.CancelError('Tableau accepted the request but returned no job ID.');
    }
    const minutes = Number(timeoutMinutes) > 0 ? Number(timeoutMinutes) : DEFAULT_JOB_TIMEOUT_MINUTES;
    return context.setTimeout({ jobId, deadline: Date.now() + minutes * 60 * 1000, minutes }, JOB_POLL_INTERVAL_MS);
}

async function continueJobWait(context) {

    const { jobId, deadline, minutes } = context.messages.timeout.content;
    const { data } = await apiRequest(context, { path: '/jobs/' + encodeId(jobId) });
    const job = mapJob(data.job);
    if (isJobFinished(job)) {
        return context.sendJson(job, 'out');
    }
    if (Date.now() > deadline) {
        throw new context.CancelError('Tableau job ' + jobId + ' did not finish within ' + minutes + ' minutes.');
    }
    return context.setTimeout({ jobId, deadline, minutes }, JOB_POLL_INTERVAL_MS);
}

function mapBackgroundJob(j = {}) {

    return pick({
        id: j.id,
        jobType: j.jobType,
        status: j.status,
        priority: toInt(j.priority),
        title: j.title,
        subtitle: j.subtitle,
        createdAt: j.createdAt,
        startedAt: j.startedAt,
        endedAt: j.endedAt
    });
}

function mapTask(t = {}) {

    const task = t.extractRefresh || t;
    const schedule = task.schedule || {};
    return pick({
        id: task.id,
        type: task.type,
        priority: toInt(task.priority),
        consecutiveFailedCount: toInt(task.consecutiveFailedCount),
        workbookId: task.workbook && task.workbook.id,
        datasourceId: task.datasource && task.datasource.id,
        scheduleId: schedule.id,
        scheduleFrequency: schedule.frequency,
        nextRunAt: schedule.nextRunAt
    });
}

function mapWebhookEvent(payload = {}) {

    return pick({
        eventType: payload.event_type,
        resource: payload.resource,
        resourceId: payload.resource_luid,
        resourceName: payload.resource_name,
        siteId: payload.site_luid,
        createdAt: payload.created_at
    });
}

/**
 * Registers one Tableau webhook per event, pointing at the component's webhook URL.
 * Webhooks can be created by site and server administrators only.
 */
async function registerWebhooks(context, events) {

    const url = context.getWebhookUrl();
    const ids = [];
    try {
        for (const event of events) {
            const { data } = await apiRequest(context, {
                method: 'POST',
                path: '/webhooks',
                data: {
                    webhook: {
                        name: ('appmixer-' + event + '-' + context.componentId).slice(0, 255),
                        event,
                        'webhook-destination': {
                            'webhook-destination-http': { method: 'POST', url }
                        }
                    }
                }
            });
            ids.push(data.webhook.id);
        }
    } catch (err) {
        await unregisterWebhooks(context, ids);
        if (err.response && err.response.status === 403) {
            throw new Error(err.message + ' Tableau webhooks can be created by site administrators only.');
        }
        throw err;
    }
    return context.saveState({ webhookIds: ids });
}

async function unregisterWebhooks(context, ids = []) {

    for (const id of ids) {
        try {
            await apiRequest(context, { method: 'DELETE', path: '/webhooks/' + encodeId(id) });
        } catch (err) {
            // Already deleted in Tableau: nothing left to clean up.
            if (!err.response || err.response.status !== 404) {
                throw err;
            }
        }
    }
}

/**
 * Reads a webhook delivery. Tableau does not sign webhooks, so only events of the account's own
 * site and of the registered event types are accepted, and duplicate deliveries are dropped.
 * @returns {Promise<object|null>} the mapped event, or null when it must be ignored
 */
async function readWebhookEvent(context, events) {

    const payload = (context.messages.webhook.content || {}).data || {};
    const event = mapWebhookEvent(payload);
    if (!event.eventType || !events.includes(event.eventType) || !event.resourceId) {
        await context.log({ step: 'Ignoring a webhook request that is not a registered Tableau event.', event });
        return null;
    }
    const session = await getSession(context);
    if (event.siteId && event.siteId !== session.siteId) {
        await context.log({ step: 'Ignoring a Tableau event of another site.', event });
        return null;
    }
    const cacheKey = 'tableau-webhook-' + context.componentId + '-'
        + crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex');
    let lock;
    try {
        lock = await context.lock(context.componentId, { ttl: 10000, retryDelay: 500, maxRetryCount: 20 });
        if (await context.staticCache.get(cacheKey)) {
            return null;
        }
        await context.staticCache.set(cacheKey, true, 10 * 60 * 1000);
    } finally {
        if (lock) {
            await lock.unlock();
        }
    }
    return event;
}

/**
 * Saves a binary export into Appmixer file storage.
 */
async function saveBinary(context, { path, params, fileName }) {

    const { data } = await apiRequest(context, { path, params, responseType: 'arraybuffer' });
    const buffer = Buffer.from(data);
    const file = await context.saveFileStream(pathModule.normalize(fileName), buffer);
    return { fileId: file.fileId, fileName, fileSize: buffer.length };
}

/**
 * View filters (vf_<field>=value) from a key-value input.
 */
function viewFilterParams(context, value) {

    const filters = kvToObject(value);
    return Object.keys(filters).reduce((params, field) => {
        const name = field.startsWith('vf_') ? field : 'vf_' + field;
        params[name] = String(filters[field]);
        return params;
    }, {});
}

function safeFileName(value, fallback) {

    const name = String(value || '').replace(/[^A-Za-z0-9._ -]+/g, '_').trim();
    return name || fallback;
}

/**
 * Resolve a user supplied endpoint against the connected server and refuse anything that would
 * send the session token somewhere else. "{site-id}" in the path is replaced with the site LUID.
 */
function resolveApiUrl(context, url, siteId) {

    const origin = serverOrigin(context.auth.serverUrl);
    let input = String(url).trim().split('{site-id}').join(siteId || '');
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(input) || input.startsWith('//');
    if (!absolute) {
        input = input.startsWith('/') ? input : '/' + input;
        if (!input.startsWith('/api/')) {
            input = '/api/' + API_VERSION + input;
        }
    }
    let parsed;
    try {
        parsed = new URL(input, origin);
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
}

function parseJsonInput(context, value, label) {

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
}

/**
 * Convert a key-value inspector input into a plain object. The Designer stores the rows as the JSON
 * string of an object; a plain object and an array of {key, value} rows are accepted too.
 */
function kvToObject(value) {

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
}

module.exports = {

    API_VERSION,
    serverOrigin,
    siteContentUrl,
    signIn,
    getSession,
    apiRequest,
    encodeId,
    buildFilter,
    toTableauDate,
    toList,
    toInt,
    mapWorkbook,
    mapView,
    mapDataSource,
    mapUser,
    mapGroup,
    mapJob,
    isJobFinished,
    waitForJob,
    continueJobWait,
    mapBackgroundJob,
    mapTask,
    mapWebhookEvent,
    registerWebhooks,
    unregisterWebhooks,
    readWebhookEvent,
    saveBinary,
    viewFilterParams,
    safeFileName,
    resolveApiUrl,
    parseJsonInput,
    kvToObject,

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
