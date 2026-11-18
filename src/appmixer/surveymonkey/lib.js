'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// SurveyMonkey keeps every account in one data center: US, EU or Canada. The token exchange
// returns the account's API host as "access_url" (public_api_docs, _overview.md, "Access URL").
// Only these hosts ever receive the account's access token.
const DEFAULT_API_ORIGIN = 'https://api.surveymonkey.com';
const API_ORIGINS = [
    'https://api.surveymonkey.com',
    'https://api.eu.surveymonkey.com',
    'https://api.surveymonkey.ca'
];
const API_PATH = '/v3';

// Scopes are configured in the SurveyMonkey app settings, not sent in the authorization URL.
// The list documents what the components need.
const SCOPES = [
    'users_read',
    'surveys_read',
    'surveys_write',
    'collectors_read',
    'collectors_write',
    'contacts_read',
    'contacts_write',
    'responses_read',
    'responses_read_detail',
    'webhooks_read',
    'webhooks_write'
];

// "Max Page Size: 1000 resources, unless otherwise specified"; responses/bulk allows 100.
const MAX_PAGE_SIZE = 1000;
const MAX_BULK_PAGE_SIZE = 100;

const DEFAULT_PREFIX = 'surveymonkey-objects-export';

const SURVEY_LIST_INCLUDE = 'date_created,date_modified,response_count,question_count,language,preview,analyze_url';

// HTTP statuses that retrying cannot fix (bad input, missing permission or plan, not found, conflict).
const CANCEL_STATUSES = [400, 403, 404, 409, 410, 413];

const cancelError = (context, message) => {

    return context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * The API origin of a value, when it is one of SurveyMonkey's API hosts; otherwise null.
 * @param {string} value
 * @returns {string|null}
 */
const trustedOrigin = (value) => {

    if (!value || typeof value !== 'string') {
        return null;
    }
    let parsed;
    try {
        parsed = new URL(value);
    } catch (err) {
        return null;
    }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
        return null;
    }
    return API_ORIGINS.includes(parsed.origin) ? parsed.origin : null;
};

const getProfileInfo = (context) => {

    return (context.auth && context.auth.profileInfo) || context.profileInfo || {};
};

/**
 * The API origin of the connected account (stored in the profile when the account was connected).
 * @param {object} context
 * @returns {string}
 */
const apiOrigin = (context) => {

    const { accessUrl } = getProfileInfo(context);
    if (!accessUrl) {
        return DEFAULT_API_ORIGIN;
    }
    const origin = trustedOrigin(accessUrl);
    if (!origin) {
        throw new Error('The SurveyMonkey account has an unsupported API host. Reconnect the account.');
    }
    return origin;
};

/**
 * The one place that turns a connected account into request headers.
 * Components read the token from context.auth, auth.js callbacks from context.accessToken.
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    const token = context.auth && context.auth.accessToken ? context.auth.accessToken : context.accessToken;
    return { 'Authorization': 'bearer ' + token };
};

/**
 * Turn an HTTP error into an error with SurveyMonkey's message
 * ({ error: { id, name, message, http_status_code } }). Errors retrying cannot fix become CancelError.
 * @param {object} context
 * @param {Error} err
 * @returns {Error}
 */
const toApiError = (context, err) => {

    const response = err && err.response;
    if (!response) {
        return err;
    }
    const detail = response.data && response.data.error ? response.data.error : {};
    const code = detail.id ? ', error ' + detail.id : '';
    const message = 'SurveyMonkey API error (HTTP ' + response.status + code + '): ' +
        (detail.message || response.statusText || err.message);
    const error = CANCEL_STATUSES.includes(response.status) ? cancelError(context, message) : new Error(message);
    error.response = { status: response.status, data: response.data };
    return error;
};

/**
 * Call the SurveyMonkey API v3 of the connected account.
 * @param {object} context
 * @param {object} options { method, path, params, data, origin }
 * @returns {Promise<*>} the response body
 */
const request = async (context, { method = 'GET', path, params, data, origin }) => {

    const options = {
        method,
        url: (origin || apiOrigin(context)) + API_PATH + path,
        headers: authHeaders(context)
    };
    if (params && Object.keys(params).length) {
        options.params = params;
    }
    if (data !== undefined) {
        options.data = data;
    }
    try {
        const response = await context.httpRequest(options);
        return response.data;
    } catch (err) {
        throw toApiError(context, err);
    }
};

/**
 * Find the data center of an access token: the stored one, or the first host that accepts it.
 * A token used on the wrong host is refused (error 1018), so this is only needed when the
 * access_url of the token exchange is not known.
 * @param {object} context
 * @param {string[]} [origins]
 * @returns {Promise<{origin: string, user: object}>}
 */
const findAccountOrigin = async (context, origins = API_ORIGINS) => {

    let lastError;
    for (const origin of origins) {
        try {
            const user = await request(context, { path: '/users/me', origin });
            return { origin, user };
        } catch (err) {
            lastError = err;
            const status = err.response && err.response.status;
            // Only an authorization refusal means "try the next data center".
            if (status !== 401 && status !== 403) {
                throw err;
            }
        }
    }
    throw lastError;
};

const encodeId = (value) => encodeURIComponent(String(value).trim());

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

    const key = 'surveymonkey-' + getCacheKey({ ...keyParts, origin: apiOrigin(context), token: context.auth.accessToken });
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

// Surveys -----------------------------------------------------------------------------------

/**
 * Surveys of the account, most recently modified first (one page of up to 1000).
 * @param {object} context
 * @param {object} [options] { perPage }
 * @returns {Promise<object[]>}
 */
const listSurveys = async (context, { perPage = MAX_PAGE_SIZE } = {}) => {

    const body = await request(context, {
        path: '/surveys',
        params: {
            per_page: perPage,
            sort_by: 'date_modified',
            sort_order: 'DESC',
            include: SURVEY_LIST_INCLUDE
        }
    });
    return (body && body.data) || [];
};

const getSurvey = async (context, surveyId) => {

    return request(context, { path: '/surveys/' + encodeId(surveyId) });
};

const getSurveyDetails = async (context, surveyId) => {

    return request(context, { path: '/surveys/' + encodeId(surveyId) + '/details' });
};

// Responses ---------------------------------------------------------------------------------

/**
 * One response with its answers (needs the "View Response Details" scope, a paid plan).
 * @param {object} context
 * @param {string} surveyId
 * @param {string} responseId
 * @param {object} [options] { simple } true adds question and answer text to the IDs
 * @returns {Promise<object>}
 */
const getResponseDetails = async (context, surveyId, responseId, { simple } = {}) => {

    return request(context, {
        path: '/surveys/' + encodeId(surveyId) + '/responses/' + encodeId(responseId) + '/details',
        params: simple ? { simple: 'true' } : undefined
    });
};

/**
 * A response for a trigger: with answers when the plan allows it, otherwise its metadata only
 * (the "View Responses" scope is available on every plan).
 * @param {object} context
 * @param {string} surveyId
 * @param {string} responseId
 * @param {object} [options] { simple }
 * @returns {Promise<object>}
 */
const getResponseForTrigger = async (context, surveyId, responseId, options = {}) => {

    try {
        return await getResponseDetails(context, surveyId, responseId, options);
    } catch (err) {
        if (!err.response || err.response.status !== 403) {
            throw err;
        }
        await context.log({ step: 'Response details not available, emitting response metadata only', error: err.message });
        const response = await request(context, {
            path: '/surveys/' + encodeId(surveyId) + '/responses/' + encodeId(responseId)
        });
        return { ...response, pages: [] };
    }
};

/**
 * ID of the newest completed response of a survey, or null.
 * @param {object} context
 * @param {string} surveyId
 * @returns {Promise<string|null>}
 */
const findLatestResponseId = async (context, surveyId) => {

    const body = await request(context, {
        path: '/surveys/' + encodeId(surveyId) + '/responses',
        params: { per_page: 1, sort_by: 'date_modified', sort_order: 'DESC', status: 'completed' }
    });
    const first = ((body && body.data) || [])[0];
    return first ? first.id : null;
};

// Webhook triggers --------------------------------------------------------------------------

/**
 * Register a SurveyMonkey webhook to this component's webhook URL. A random secret is sent as
 * the webhook's "authorization" value; SurveyMonkey passes it back as the Authorization header
 * of every event, so events that do not carry it are rejected.
 * @param {object} context
 * @param {object} options { name, eventType, objectType, objectIds }
 */
const startWebhook = async (context, { name, eventType, objectType, objectIds }) => {

    const secret = crypto.randomBytes(32).toString('hex');
    const data = {
        name,
        event_type: eventType,
        subscription_url: context.getWebhookUrl(),
        authorization: secret
    };
    if (objectType) {
        data.object_type = objectType;
        data.object_ids = objectIds;
    }
    const webhook = await request(context, { method: 'POST', path: '/webhooks', data });
    return context.saveState({ webhookId: webhook.id, secret });
};

const stopWebhook = async (context) => {

    const state = await context.loadState() || {};
    if (!state.webhookId) {
        return;
    }
    try {
        await request(context, { method: 'DELETE', path: '/webhooks/' + encodeId(state.webhookId) });
    } catch (err) {
        // Already gone (deleted in SurveyMonkey or the account was disconnected).
        if (!err.response || err.response.status !== 404) {
            throw err;
        }
    }
};

const sameSecret = (expected, received) => {

    const a = Buffer.from(String(expected));
    const b = Buffer.from(String(received));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * Whether a webhook call carries the secret registered in start(). The header value is
 * compared as sent and as its last word (in case it arrives prefixed, e.g. "Bearer <secret>").
 * @param {object} headers
 * @param {string} secret
 * @returns {boolean}
 */
const isAuthorizedWebhook = (headers, secret) => {

    if (!secret || !headers) {
        return false;
    }
    const value = headers.authorization || headers.Authorization;
    if (!value || typeof value !== 'string') {
        return false;
    }
    const trimmed = value.trim();
    const lastWord = trimmed.split(/\s+/).pop();
    return sameSecret(secret, trimmed) || sameSecret(secret, lastWord);
};

/**
 * The event of a webhook call, or null when it is not a new, authorized event: the HEAD
 * request SurveyMonkey sends to check the subscription URL, a call without the secret, an
 * event of another type, or an event already processed.
 * @param {object} context
 * @param {string} eventType
 * @returns {Promise<object|null>}
 */
const readWebhookEvent = async (context, eventType) => {

    const { method, headers, data } = context.messages.webhook.content;
    if (method && String(method).toUpperCase() !== 'POST') {
        return null;
    }
    const state = await context.loadState() || {};
    if (!isAuthorizedWebhook(headers, state.secret)) {
        await context.log({ step: 'Ignoring a webhook call without the expected authorization header' });
        return null;
    }
    if (!data || typeof data !== 'object' || data.event_type !== eventType) {
        return null;
    }
    if (data.event_id) {
        const key = 'surveymonkey-event-' + context.componentId + '-' + data.event_id;
        if (await context.staticCache.get(key)) {
            return null;
        }
        await context.staticCache.set(key, true, 10 * 60 * 1000);
    }
    return data;
};

// MakeApiCall helpers -----------------------------------------------------------------------

/**
 * Resolve a user supplied endpoint (relative path or absolute URL) against the account's API
 * host and refuse anything that would send the account's credential somewhere else.
 * @param {object} context
 * @param {string} url
 * @returns {string}
 */
const resolveApiUrl = (context, url) => {

    const base = apiOrigin(context);
    const value = String(url).trim();
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')
        ? value
        : (value.startsWith('/') ? '' : '/') + value;

    let parsed;
    try {
        parsed = new URL(candidate, base);
    } catch (error) {
        throw new context.CancelError('API Endpoint Path is not a valid URL: ' + url);
    }

    if (parsed.username || parsed.password) {
        throw new context.CancelError('API Endpoint Path must not contain credentials.');
    }

    if (parsed.origin !== base) {
        throw new context.CancelError('API Endpoint Path must target ' + base + ', got ' + parsed.origin + '.');
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

    DEFAULT_API_ORIGIN,
    API_ORIGINS,
    SCOPES,
    MAX_PAGE_SIZE,
    MAX_BULK_PAGE_SIZE,

    trustedOrigin,
    apiOrigin,
    authHeaders,
    request,
    findAccountOrigin,
    encodeId,
    callCached,
    listSurveys,
    getSurvey,
    getSurveyDetails,
    getResponseDetails,
    getResponseForTrigger,
    findLatestResponseId,
    startWebhook,
    stopWebhook,
    isAuthorizedWebhook,
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
