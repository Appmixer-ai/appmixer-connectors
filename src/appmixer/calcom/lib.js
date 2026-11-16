'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_BASE_URL = 'https://api.cal.com';
const DEFAULT_PREFIX = 'calcom-objects-export';

// Cal.com pins the shape of every endpoint with the cal-api-version header. Without it an
// endpoint silently answers with an older response shape, so every call sends the version
// the API reference lists for that endpoint.
const API_VERSIONS = {
    bookings: '2026-02-25',
    bookingsList: '2026-05-01',
    attendees: '2024-08-13',
    slots: '2024-09-04',
    eventTypes: '2026-06-12'
};

// Payload format of the webhooks the triggers register. Pinned so the trigger output does
// not change when Cal.com adds a newer format.
const WEBHOOK_PAYLOAD_VERSION = '2021-10-20';
const SIGNATURE_HEADER = 'x-cal-signature-256';

// GET /v2/bookings returns at most 100 bookings per page.
const BOOKINGS_PAGE_SIZE = 100;

/**
 * The one place that turns a connected account into request headers.
 * Components read the key from context.auth, auth.js callbacks from context.apiKey.
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    const apiKey = context.auth && context.auth.apiKey ? context.auth.apiKey : context.apiKey;
    return { 'Authorization': 'Bearer ' + apiKey };
};

const cancelError = (context, message) => {

    return context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * Call the Cal.com API v2.
 * Cal.com answers errors with { status: 'error', error: { code, message } }. Client errors
 * other than 429 cannot be fixed by retrying, so they become CancelError with that message.
 * @param {object} context
 * @param {object} options
 * @param {string} options.method
 * @param {string} options.path path under https://api.cal.com, e.g. /v2/bookings
 * @param {string} [options.version] cal-api-version header value
 * @param {object} [options.params]
 * @param {object} [options.data]
 * @returns {Promise<*>} the response body
 */
const request = async (context, { method = 'GET', path, version, params, data }) => {

    const headers = authHeaders(context);
    if (version) {
        headers['cal-api-version'] = version;
    }
    const options = { method, url: API_BASE_URL + path, headers };
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
        const status = err && err.response && err.response.status;
        const body = err && err.response && err.response.data;
        const detail = body && body.error
            ? (body.error.message || body.error.code)
            : (body && body.message);
        if (status && status >= 400 && status < 500 && status !== 429) {
            const message = Array.isArray(detail) ? detail.join('; ') : detail;
            throw cancelError(context, 'Cal.com API error (' + status + '): ' + (message || err.message));
        }
        throw err;
    }
};

/**
 * A booking endpoint answers with one booking, or an array of occurrences for a recurring
 * booking. Components return one booking: the first occurrence.
 * @param {object|object[]} data
 * @returns {object}
 */
const firstBooking = (data) => {

    return Array.isArray(data) ? data[0] : data;
};

const getBooking = async (context, bookingUid) => {

    const body = await request(context, {
        path: '/v2/bookings/' + encodeURIComponent(bookingUid),
        version: API_VERSIONS.bookings
    });
    return firstBooking(body.data);
};

/**
 * One page of bookings (GET /v2/bookings), at most 100.
 * @param {object} context
 * @param {object} params query parameters (filters, sort)
 * @returns {Promise<object[]>}
 */
const findBookings = async (context, params) => {

    const body = await request(context, {
        path: '/v2/bookings',
        version: API_VERSIONS.bookingsList,
        params: { limit: BOOKINGS_PAGE_SIZE, ...params }
    });
    return body.data || [];
};

const listEventTypes = async (context) => {

    const body = await request(context, { path: '/v2/event-types', version: API_VERSIONS.eventTypes });
    return body.data || [];
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

    const key = 'calcom-' + getCacheKey({ ...keyParts, apiKey: context.auth.apiKey });
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
 * Parse a numeric ID or count typed into a text input or mapped from a variable.
 * @param {object} context
 * @param {*} value
 * @param {string} label
 * @returns {number|undefined}
 */
const toInteger = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isInteger(number)) {
        throw cancelError(context, label + ' must be a whole number.');
    }
    return number;
};

/**
 * Turn a date input into an ISO 8601 UTC string (Cal.com expects UTC times).
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
        throw cancelError(context, label + ' must be valid JSON.');
    }
};

/**
 * Request body fields shared by Create Event Type and Update Event Type.
 * @param {object} context
 * @param {object} input
 * @returns {object}
 */
const eventTypeData = (context, input) => {

    const data = {};
    if (input.title) {
        data.title = input.title;
    }
    if (input.slug) {
        data.slug = input.slug;
    }
    if (input.description) {
        data.description = input.description;
    }
    const numbers = {
        lengthInMinutes: 'Length (Minutes)',
        minimumBookingNotice: 'Minimum Booking Notice (Minutes)',
        slotInterval: 'Slot Interval (Minutes)',
        beforeEventBuffer: 'Buffer Before (Minutes)',
        afterEventBuffer: 'Buffer After (Minutes)'
    };
    for (const [field, label] of Object.entries(numbers)) {
        const value = toInteger(context, input[field], label);
        if (value !== undefined) {
            data[field] = value;
        }
    }
    return data;
};

// Webhook triggers ----------------------------------------------------------------------

/**
 * Subscribe the trigger's webhook URL to one Cal.com trigger event (POST /v2/webhooks).
 * A random secret is registered with it so receive() can check the x-cal-signature-256 header.
 * @param {object} context
 * @param {string} triggerEvent e.g. BOOKING_CREATED
 * @returns {Promise<{webhookId: string, secret: string}>}
 */
const registerWebhook = async (context, triggerEvent) => {

    const secret = crypto.randomBytes(32).toString('hex');
    const body = await request(context, {
        method: 'POST',
        path: '/v2/webhooks',
        data: {
            active: true,
            subscriberUrl: context.getWebhookUrl(),
            triggers: [triggerEvent],
            secret,
            version: WEBHOOK_PAYLOAD_VERSION
        }
    });
    return { webhookId: String(body.data.id), secret };
};

const unregisterWebhook = async (context, webhookId) => {

    if (!webhookId) {
        return;
    }
    try {
        await request(context, { method: 'DELETE', path: '/v2/webhooks/' + encodeURIComponent(webhookId) });
    } catch (err) {
        // Already deleted in Cal.com: nothing left to clean up.
        if (!/\(404\)/.test(err.message)) {
            throw err;
        }
    }
};

/**
 * Cal.com signs the JSON body with HMAC-SHA256 of the webhook secret (hex, x-cal-signature-256).
 * The engine hands over the parsed body; Cal.com serializes it with JSON.stringify, so the
 * same serialization reproduces the signed bytes. A raw body is used when the engine has one.
 * @param {string} secret
 * @param {object} content context.messages.webhook.content
 * @returns {boolean}
 */
const verifySignature = (secret, content) => {

    const headers = content.headers || {};
    const signature = headers[SIGNATURE_HEADER];
    if (!secret || typeof signature !== 'string') {
        return false;
    }
    const candidates = [];
    if (content.rawBody) {
        candidates.push(Buffer.isBuffer(content.rawBody) ? content.rawBody : Buffer.from(String(content.rawBody)));
    }
    candidates.push(Buffer.from(typeof content.data === 'string' ? content.data : JSON.stringify(content.data)));

    const actual = Buffer.from(signature.trim().toLowerCase(), 'utf8');
    return candidates.some(raw => {
        const expected = Buffer.from(crypto.createHmac('sha256', secret).update(raw).digest('hex'), 'utf8');
        return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    });
};

/**
 * Booking events wrap the booking in "payload"; MEETING_STARTED and MEETING_ENDED send it flat.
 * Both become one flat object with triggerEvent on top.
 * @param {object} body
 * @returns {object}
 */
const normalizeWebhookEvent = (body) => {

    if (body && body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)) {
        return { triggerEvent: body.triggerEvent, createdAt: body.createdAt, ...body.payload };
    }
    return { ...body };
};

/**
 * Shared receive() of the webhook triggers: check the signature, ignore other events and
 * repeated deliveries, emit the event.
 * @param {object} context
 * @param {string} triggerEvent
 */
const receiveWebhook = async (context, triggerEvent) => {

    const content = context.messages.webhook.content;
    const { secret } = await context.loadState() || {};

    if (!verifySignature(secret, content)) {
        await context.log({ step: 'Rejected a webhook call with a missing or invalid x-cal-signature-256 header.' });
        return context.response({ error: 'Invalid signature.' }, 401);
    }

    const event = normalizeWebhookEvent(content.data || {});
    if (event.triggerEvent !== triggerEvent) {
        return context.response({});
    }

    // Cal.com can deliver the same event more than once.
    const dedupeId = event.idempotencyKey || [event.uid, event.createdAt || event.endTime].join(':');
    const cacheKey = ['calcom', context.componentId, triggerEvent, dedupeId].join('-');
    let lock;
    try {
        lock = await context.lock(cacheKey, { ttl: 10 * 1000, retryDelay: 500, maxRetryCount: 3 });
        if (await context.staticCache.get(cacheKey)) {
            return context.response({});
        }
        await context.staticCache.set(cacheKey, true, 10 * 60 * 1000);
        await context.sendJson(event, 'out');
    } finally {
        lock && await lock.unlock();
    }
    return context.response({});
};

const toUpperStatus = (status) => (typeof status === 'string' ? status.toUpperCase() : status);

const toPerson = (person) => ({
    name: person.name,
    email: person.email,
    timeZone: person.timeZone
});

/**
 * Reshape a booking read from the REST API into the body the webhook delivers for the event,
 * for the triggers' test() (Flow Test Mode).
 * @param {object} booking GET /v2/bookings item
 * @param {string} triggerEvent
 * @returns {object}
 */
const toWebhookShape = (booking, triggerEvent) => {

    const host = (booking.hosts || [])[0] || {};
    const attendees = (booking.attendees || []).map(toPerson);

    if (triggerEvent === 'MEETING_ENDED') {
        return {
            triggerEvent,
            id: booking.id,
            uid: booking.uid,
            title: booking.title,
            description: booking.description,
            eventTypeId: booking.eventTypeId,
            startTime: booking.start,
            endTime: booking.end,
            location: booking.location,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            status: toUpperStatus(booking.status),
            userPrimaryEmail: host.email,
            user: { email: host.email, name: host.name, timeZone: host.timeZone, username: host.username },
            attendees,
            metadata: booking.metadata || {}
        };
    }

    const event = {
        triggerEvent,
        createdAt: triggerEvent === 'BOOKING_CREATED' ? booking.createdAt : booking.updatedAt,
        uid: booking.uid,
        bookingId: booking.id,
        title: booking.title,
        description: booking.description,
        eventTypeId: booking.eventTypeId,
        startTime: booking.start,
        endTime: booking.end,
        length: booking.duration,
        location: booking.location,
        status: toUpperStatus(booking.status),
        organizer: {
            id: host.id,
            name: host.name,
            email: host.email,
            username: host.username,
            timeZone: host.timeZone
        },
        attendees,
        metadata: booking.metadata || {}
    };
    if (triggerEvent === 'BOOKING_CANCELLED') {
        event.cancellationReason = booking.cancellationReason;
    }
    if (triggerEvent === 'BOOKING_RESCHEDULED') {
        event.rescheduleUid = booking.rescheduledFromUid;
    }
    return event;
};

/**
 * The newest real booking matching a trigger event, read-only, for the triggers' test().
 * @param {object} context
 * @param {string} triggerEvent
 * @returns {Promise<object|null>} booking or null when the account has none
 */
const fetchLatestExample = async (context, triggerEvent) => {

    if (triggerEvent === 'BOOKING_CANCELLED') {
        return (await findBookings(context, { status: 'cancelled', sortUpdatedAt: 'desc', limit: 1 }))[0] || null;
    }
    if (triggerEvent === 'MEETING_ENDED') {
        return (await findBookings(context, { status: 'past', sortEnd: 'desc', limit: 1 }))[0] || null;
    }
    if (triggerEvent === 'BOOKING_RESCHEDULED') {
        const bookings = await findBookings(context, { sortUpdatedAt: 'desc' });
        return bookings.find(booking => booking.rescheduledFromUid) || null;
    }
    return (await findBookings(context, { sortCreated: 'desc', limit: 1 }))[0] || null;
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
    API_VERSIONS,
    WEBHOOK_PAYLOAD_VERSION,
    BOOKINGS_PAGE_SIZE,

    authHeaders,
    request,
    firstBooking,
    getBooking,
    findBookings,
    listEventTypes,
    callCached,
    toInteger,
    toIsoDate,
    parseList,
    parseJsonInput,
    eventTypeData,
    registerWebhook,
    unregisterWebhook,
    verifySignature,
    normalizeWebhookEvent,
    receiveWebhook,
    toWebhookShape,
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
