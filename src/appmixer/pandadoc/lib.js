'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_BASE_URL = 'https://api.pandadoc.com';
const DEFAULT_PREFIX = 'pandadoc-objects-export';

// GET /public/v1/documents and GET /public/v1/templates return at most 100 items per page.
const PAGE_SIZE = 100;

// A sandbox API key may make 10 requests per minute (any endpoint). A 429 is waited out
// here, honouring Retry-After, so one throttled call does not fail the whole flow.
const MAX_RATE_LIMIT_RETRIES = 4;
const DEFAULT_RETRY_AFTER_MS = 7000;
const MAX_RETRY_AFTER_MS = 30000;

// Documents are created asynchronously (document.uploaded → document.draft). Appmixer does
// not schedule a continuation shorter than one minute, so the status is checked once a minute.
const DRAFT_POLL_INTERVAL_MS = 60 * 1000;
const DRAFT_DEADLINE_MS = 10 * 60 * 1000;

// Document status names and the numeric codes the List Documents endpoint filters by.
const DOCUMENT_STATUS_CODES = {
    'document.draft': 0,
    'document.sent': 1,
    'document.completed': 2,
    'document.uploaded': 3,
    'document.error': 4,
    'document.viewed': 5,
    'document.waiting_approval': 6,
    'document.approved': 7,
    'document.rejected': 8,
    'document.waiting_pay': 9,
    'document.paid': 10,
    'document.voided': 11,
    'document.declined': 12,
    'document.external_review': 13,
    'document.scheduled': 14
};

const WEBHOOK_TOKEN_PARAM = 'token';
const WEBHOOK_EVENT_ID_HEADER = 'x-pandadoc-webhook-event-id';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cancelError = (context, message) => {

    return context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * The one place that turns a connected account into request headers.
 * Components read the key from context.auth, auth.js callbacks from context.apiKey.
 * PandaDoc expects "Authorization: API-Key <key>".
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    const apiKey = context.auth && context.auth.apiKey ? context.auth.apiKey : context.apiKey;
    return { 'Authorization': 'API-Key ' + apiKey };
};

/**
 * PandaDoc answers errors with { type, detail } where detail is a string or an object of
 * field errors. Turn it into one readable line.
 * @param {*} body
 * @returns {string|undefined}
 */
const errorDetail = (body) => {

    if (!body) {
        return undefined;
    }
    if (typeof body === 'string') {
        return body;
    }
    const detail = body.detail !== undefined ? body.detail : (body.message || body.error);
    if (detail === undefined || detail === null) {
        return body.type;
    }
    return typeof detail === 'string' ? detail : JSON.stringify(detail);
};

const retryAfterMs = (err) => {

    const headers = (err && err.response && err.response.headers) || {};
    const seconds = Number(headers['retry-after']);
    if (Number.isFinite(seconds) && seconds > 0) {
        return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
    }
    return DEFAULT_RETRY_AFTER_MS;
};

/**
 * Call the PandaDoc public API.
 * Client errors other than 429 cannot be fixed by retrying, so they become CancelError with
 * PandaDoc's message. A 429 is retried after Retry-After; when it persists the error is thrown
 * as a plain (retryable) error.
 * @param {object} context
 * @param {object} options
 * @param {string} [options.method]
 * @param {string} options.path path under https://api.pandadoc.com, e.g. /public/v1/documents
 * @param {object} [options.params]
 * @param {object} [options.data]
 * @param {string} [options.responseType]
 * @param {boolean} [options.fullResponse] return the whole response, not only the body
 * @returns {Promise<*>}
 */
const request = async (context, { method = 'GET', path, params, data, responseType, fullResponse }) => {

    const options = { method, url: API_BASE_URL + path, headers: authHeaders(context) };
    if (params && Object.keys(params).length) {
        options.params = params;
    }
    if (data !== undefined) {
        options.data = data;
    }
    if (responseType) {
        options.responseType = responseType;
    }

    for (let attempt = 0; ; attempt++) {
        try {
            const response = await context.httpRequest(options);
            return fullResponse ? response : response.data;
        } catch (err) {
            const status = err && err.response && err.response.status;
            if (status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
                await sleep(retryAfterMs(err));
                continue;
            }
            if (status && status >= 400 && status < 500 && status !== 429) {
                let body = err.response.data;
                if (Buffer.isBuffer(body)) {
                    body = body.toString('utf8');
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        // not JSON, keep the text
                    }
                }
                throw cancelError(context, 'PandaDoc API error (' + status + '): ' + (errorDetail(body) || err.message));
            }
            throw err;
        }
    }
};

// Documents -----------------------------------------------------------------------------

/**
 * The basic document fields every document endpoint returns (create, status, send).
 * @param {object} document
 * @returns {object}
 */
const toDocument = (document) => {

    const result = {
        id: document.id,
        name: document.name,
        status: document.status,
        date_created: document.date_created,
        date_modified: document.date_modified,
        expiration_date: document.expiration_date,
        version: document.version
    };
    if (document.date_completed !== undefined) {
        result.date_completed = document.date_completed;
    }
    return result;
};

const getDocumentStatus = async (context, documentId) => {

    return request(context, { path: '/public/v1/documents/' + encodeURIComponent(documentId) });
};

const getDocumentDetails = async (context, documentId) => {

    return request(context, { path: '/public/v1/documents/' + encodeURIComponent(documentId) + '/details' });
};

/**
 * One page of documents (GET /public/v1/documents), at most 100.
 * @param {object} context
 * @param {object} params query parameters (filters, order_by)
 * @returns {Promise<object[]>}
 */
const listDocuments = async (context, params) => {

    const body = await request(context, {
        path: '/public/v1/documents',
        params: { count: PAGE_SIZE, ...params }
    });
    return (body && body.results) || [];
};

/**
 * Create a document (POST /public/v1/documents) and emit it. PandaDoc creates documents
 * asynchronously: with waitForDraft the component schedules a continuation that checks the
 * status once a minute and emits the document when it reaches document.draft, so a following
 * Send Document can use it right away.
 * @param {object} context
 * @param {object} body request body
 * @param {boolean} waitForDraft
 */
const createDocument = async (context, body, waitForDraft) => {

    const created = await request(context, { method: 'POST', path: '/public/v1/documents', data: body });
    if (!waitForDraft || created.status === 'document.draft') {
        return context.sendJson(toDocument(created), 'out');
    }
    return context.setTimeout({
        documentId: created.id,
        deadline: Date.now() + DRAFT_DEADLINE_MS
    }, DRAFT_POLL_INTERVAL_MS);
};

/**
 * The continuation scheduled by createDocument().
 * @param {object} context
 */
const continueWaitForDraft = async (context) => {

    const { documentId, deadline } = context.messages.timeout.content;
    const document = await getDocumentStatus(context, documentId);

    if (document.status === 'document.error') {
        throw cancelError(context, 'PandaDoc could not create document ' + documentId + ' (status document.error).');
    }
    if (document.status !== 'document.uploaded') {
        return context.sendJson(toDocument(document), 'out');
    }
    if (Date.now() > deadline) {
        throw cancelError(context, 'Document ' + documentId + ' did not reach the draft status in '
            + (DRAFT_DEADLINE_MS / 60000) + ' minutes.');
    }
    return context.setTimeout({ documentId, deadline }, DRAFT_POLL_INTERVAL_MS);
};

/**
 * Recipients of a new document: the one described by the recipient inputs plus the JSON array
 * of additional recipients.
 * @param {object} context
 * @param {object} input
 * @returns {object[]}
 */
const buildRecipients = (context, input) => {

    const recipients = [];
    if (input.recipientEmail) {
        const recipient = { email: input.recipientEmail };
        if (input.recipientFirstName) {
            recipient.first_name = input.recipientFirstName;
        }
        if (input.recipientLastName) {
            recipient.last_name = input.recipientLastName;
        }
        if (input.recipientRole) {
            recipient.role = input.recipientRole;
        }
        recipients.push(recipient);
    }
    const additional = parseJsonInput(context, input.additionalRecipients, 'Additional Recipients');
    if (additional !== undefined) {
        if (!Array.isArray(additional)) {
            throw cancelError(context, 'Additional Recipients must be a JSON array of recipients.');
        }
        recipients.push(...additional);
    }
    return recipients;
};

/**
 * Request body fields shared by both Create Document components.
 * @param {object} context
 * @param {object} input
 * @returns {object}
 */
const commonDocumentFields = (context, input) => {

    const body = {};
    if (input.name) {
        body.name = input.name;
    }
    if (input.folderId) {
        body.folder_uuid = input.folderId;
    }
    const recipients = buildRecipients(context, input);
    if (recipients.length) {
        body.recipients = recipients;
    }
    const tokens = kvToObject(input.tokens);
    if (Object.keys(tokens).length) {
        body.tokens = Object.entries(tokens).map(([name, value]) => ({ name, value: String(value) }));
    }
    const fields = kvToObject(input.fields);
    if (Object.keys(fields).length) {
        body.fields = Object.entries(fields).reduce((res, [name, value]) => {
            res[name] = { value };
            return res;
        }, {});
    }
    const metadata = kvToObject(input.metadata);
    if (Object.keys(metadata).length) {
        body.metadata = metadata;
    }
    const tags = parseList(input.tags);
    if (tags.length) {
        body.tags = tags;
    }
    return body;
};

// Templates -----------------------------------------------------------------------------

const listTemplates = async (context) => {

    const body = await request(context, { path: '/public/v1/templates', params: { count: PAGE_SIZE } });
    return (body && body.results) || [];
};

// Contacts ------------------------------------------------------------------------------

const CONTACT_FIELDS = {
    email: 'email',
    firstName: 'first_name',
    lastName: 'last_name',
    company: 'company',
    jobTitle: 'job_title',
    phone: 'phone',
    country: 'country',
    state: 'state',
    streetAddress: 'street_address',
    city: 'city',
    postalCode: 'postal_code'
};

/**
 * Contact request body from the component inputs; only the fields that were filled in.
 * @param {object} input
 * @param {string[]} allowed input names the endpoint accepts
 * @returns {object}
 */
const contactData = (input, allowed) => {

    const data = {};
    for (const name of allowed) {
        const value = input[name];
        if (value !== undefined && value !== null && value !== '') {
            data[CONTACT_FIELDS[name]] = value;
        }
    }
    return data;
};

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

    const key = 'pandadoc-' + getCacheKey({ ...keyParts, apiKey: context.auth.apiKey });
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

/**
 * Parse a list typed as comma or newline separated text (or mapped as an array).
 * @param {string|string[]} value
 * @returns {string[]}
 */
const parseList = (value) => {

    if (!value) {
        return [];
    }
    const items = Array.isArray(value) ? value : String(value).split(/[,\n]/);
    return items.map(item => String(item).trim()).filter(Boolean);
};

/**
 * Parse a textarea JSON input. Empty input means "no value"; an object is passed through.
 * @param {object} context
 * @param {string|object} value
 * @param {string} label
 * @returns {*}
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
        throw cancelError(context, label + ' must be valid JSON.');
    }
};

/**
 * Turn a date input into an ISO 8601 string.
 * @param {object} context
 * @param {*} value
 * @param {string} label
 * @returns {string|undefined}
 */
const toIsoDate = (context, value, label) => {

    if (!value) {
        return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw cancelError(context, label + ' is not a valid date.');
    }
    return date.toISOString();
};

// Webhook triggers ----------------------------------------------------------------------

const safeEqual = (a, b) => {

    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
};

/**
 * The URL the subscription delivers to: the trigger's webhook URL with a random token, so
 * receive() can tell PandaDoc's calls from anybody else's.
 * @param {object} context
 * @param {string} token
 * @returns {string}
 */
const subscriptionUrl = (context, token) => {

    const url = new URL(context.getWebhookUrl());
    url.searchParams.set(WEBHOOK_TOKEN_PARAM, token);
    return url.toString();
};

/**
 * Create a webhook subscription for one PandaDoc event (POST /public/v1/webhook-subscriptions).
 * @param {object} context
 * @param {string} event e.g. document_state_changed
 * @returns {Promise<{webhookId: string, token: string, sharedKey: string}>}
 */
const registerWebhook = async (context, event) => {

    const token = crypto.randomBytes(24).toString('hex');
    const body = await request(context, {
        method: 'POST',
        path: '/public/v1/webhook-subscriptions',
        data: {
            name: 'Appmixer ' + event + ' ' + context.componentId,
            url: subscriptionUrl(context, token),
            active: true,
            triggers: [event],
            payload: ['metadata', 'fields', 'tokens']
        }
    });
    return { webhookId: body.uuid, token, sharedKey: body.shared_key };
};

const unregisterWebhook = async (context, webhookId) => {

    if (!webhookId) {
        return;
    }
    try {
        await request(context, {
            method: 'DELETE',
            path: '/public/v1/webhook-subscriptions/' + encodeURIComponent(webhookId)
        });
    } catch (err) {
        // Already deleted in PandaDoc: nothing left to clean up.
        if (!/\(404\)/.test(err.message)) {
            throw err;
        }
    }
};

/**
 * Check a webhook call: the token we put into the subscription URL must match, and when the
 * engine hands over the raw body, PandaDoc's HMAC-SHA256 signature (query parameter
 * "signature", hex, keyed with the subscription's shared key) must match too.
 * @param {object} state the trigger state saved in start()
 * @param {object} content context.messages.webhook.content
 * @returns {boolean}
 */
const verifyWebhook = (state, content) => {

    const query = content.query || {};
    if (!state || !state.token || !safeEqual(query[WEBHOOK_TOKEN_PARAM], state.token)) {
        return false;
    }
    if (content.rawBody && state.sharedKey) {
        const raw = Buffer.isBuffer(content.rawBody) ? content.rawBody : Buffer.from(String(content.rawBody));
        const expected = crypto.createHmac('sha256', state.sharedKey).update(raw).digest('hex');
        const signature = typeof query.signature === 'string' ? query.signature.trim().toLowerCase() : '';
        return safeEqual(expected, signature);
    }
    return true;
};

/**
 * One event of a delivery as the trigger emits it: the event name and the event data
 * (for document events the document, as Document Details returns it).
 * @param {string} event
 * @param {object} data
 * @returns {object}
 */
const toEvent = (event, data) => ({ event, ...(data || {}) });

/**
 * Shared receive() of the webhook triggers: check the call, take the events of the trigger's
 * type out of the delivered array, drop repeated deliveries and emit them one by one.
 * @param {object} context
 * @param {string} eventName
 * @param {Function} [filter] (data) => boolean, extra filter on the event data
 */
const receiveWebhook = async (context, eventName, filter) => {

    const content = context.messages.webhook.content;
    const state = await context.loadState() || {};

    if (!verifyWebhook(state, content)) {
        await context.log({ step: 'Rejected a webhook call with a missing or invalid token or signature.' });
        return context.response({ error: 'Forbidden' }, 403);
    }

    const body = content.data;
    const events = (Array.isArray(body) ? body : [body])
        .filter(item => item && item.event === eventName && (!filter || filter(item.data || {})));

    const headers = content.headers || {};
    const deliveryId = headers[WEBHOOK_EVENT_ID_HEADER];
    let lock;
    try {
        lock = await context.lock('pandadoc-' + context.componentId, { ttl: 10 * 1000, retryDelay: 500, maxRetryCount: 3 });
        for (let index = 0; index < events.length; index++) {
            const data = events[index].data || {};
            // A delivery resent from the Developer Dashboard carries the same event id.
            const dedupeId = deliveryId
                ? deliveryId + ':' + index
                : [data.id, data.status, data.date_modified, data.action_date].join(':');
            const cacheKey = ['pandadoc', context.componentId, eventName, dedupeId].join('-');
            if (await context.staticCache.get(cacheKey)) {
                continue;
            }
            await context.staticCache.set(cacheKey, true, 10 * 60 * 1000);
            await context.sendJson(toEvent(eventName, data), 'out');
        }
    } finally {
        lock && await lock.unlock();
    }
    return context.response({});
};

/**
 * The newest real document matching a trigger, reshaped into the event the webhook delivers
 * (Document Details is what document webhooks carry), for the triggers' test().
 * Read-only.
 * @param {object} context
 * @param {string} eventName
 * @param {object} params List Documents filters (status, order_by)
 * @returns {Promise<object|null>}
 */
const fetchLatestExample = async (context, eventName, params) => {

    const [latest] = await listDocuments(context, { ...params, count: 1 });
    if (!latest) {
        return null;
    }
    const details = await getDocumentDetails(context, latest.id);
    return toEvent(eventName, details);
};

// MakeApiCall helpers -------------------------------------------------------------------

/**
 * Resolve a user supplied endpoint (relative path or absolute URL) against the API base and
 * refuse anything that would send the account's credential somewhere else.
 * @param {object} context
 * @param {string} url
 * @returns {string}
 */
const resolveApiUrl = (context, url) => {

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
};

// outputType helpers --------------------------------------------------------------------

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
    PAGE_SIZE,
    DOCUMENT_STATUS_CODES,
    DRAFT_POLL_INTERVAL_MS,

    authHeaders,
    request,
    toDocument,
    getDocumentStatus,
    getDocumentDetails,
    listDocuments,
    createDocument,
    continueWaitForDraft,
    buildRecipients,
    commonDocumentFields,
    listTemplates,
    contactData,
    callCached,
    parseList,
    parseJsonInput,
    toIsoDate,
    registerWebhook,
    unregisterWebhook,
    verifyWebhook,
    toEvent,
    receiveWebhook,
    fetchLatestExample,
    resolveApiUrl,
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
            return context.sendJson([{
                label,
                value,
                schema: {
                    type: 'array',
                    items: { type: 'object', properties: itemSchema }
                }
            }, {
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
