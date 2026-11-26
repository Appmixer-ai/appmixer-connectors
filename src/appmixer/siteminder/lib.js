'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// SiteMinder Exchange (SMX) has two halves, and this file serves both:
// - Availability and rates: a REST API the components call with a Bearer token
//   (https://developer.siteminder.com/smx-api/reference/availability-and-rates).
// - Reservations: SOAP messages SiteMinder pushes to routes.js. The triggers and the route share
//   credentialHash() and the event name below; the XML itself lives in soap.js.

// The two SMX environments. The Bearer token is only ever sent to one of these origins.
const ENVIRONMENTS = {
    production: 'https://exchange-api.siteminder.com',
    preproduction: 'https://tpi-subscriberx.preprod.siteminderlabs.com'
};

const BASE_PATH = '/inventory/v1';

// One event name for every reservation listener. The route filters the listeners by credentials
// and hotel code (see routes.js), never by the event name alone.
const RESERVATION_EVENT = 'reservation';

// Characters SiteMinder forbids in the endpoint credentials because they break the XML they
// travel in (https://developer.siteminder.com/smx-api/guides/integration-requirements).
const FORBIDDEN_CREDENTIAL_CHARACTERS = /[<>&"']/;

const MAX_CODE_LENGTH = 255;
const MAX_RANGE_DAYS = 30;
const DEFAULT_PREFIX = 'siteminder-objects-export';

// Statuses a retry cannot fix.
const CANCEL_STATUSES = [400, 401, 403, 404, 405];

const STATUS_HINTS = {
    400: 'SiteMinder rejected the request as invalid.',
    401: 'SiteMinder did not accept the API token. Generate a new token in the SMX Partner Portal and '
        + 'reconnect the account. A token of one environment does not work in the other.',
    403: 'SiteMinder denied access. The hotel is not connected to your application through this publisher.',
    404: 'SiteMinder did not find this publisher, hotel, room type or rate plan.',
    405: 'This publisher does not provide availability and rates through SiteMinder Exchange.',
    429: 'SiteMinder rate limit reached.'
};

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

/**
 * A CancelError in a component, a plain Error in auth.js (the auth context has no CancelError).
 * @param {object} context
 * @param {string} message
 * @returns {Error}
 */
const cancelError = (context, message) => {

    return context && context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * The fields of the connected account. Components read them from context.auth, the auth.js
 * callbacks from the context itself (the auth context has no "auth").
 * @param {object} context
 * @returns {{ environment: string, apiToken: string, soapUsername: string, soapPassword: string }}
 */
const account = (context) => {

    const auth = context.auth;
    const source = auth && (auth.environment !== undefined || auth.apiToken !== undefined
        || auth.soapUsername !== undefined) ? auth : context;
    return {
        environment: isEmpty(source.environment) ? 'production' : String(source.environment).trim(),
        // A token pasted with its "Bearer " prefix or a line break still works.
        apiToken: String(source.apiToken || '').trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, ''),
        soapUsername: isEmpty(source.soapUsername) ? '' : String(source.soapUsername),
        soapPassword: isEmpty(source.soapPassword) ? '' : String(source.soapPassword)
    };
};

/**
 * The API origin of the connected account. The environment is one of a fixed list, so no account
 * field ever becomes part of a request host.
 * @param {object} context
 * @returns {string}
 */
const apiOrigin = (context) => {

    const { environment } = account(context);
    if (!Object.prototype.hasOwnProperty.call(ENVIRONMENTS, environment)) {
        throw cancelError(context, `Unknown SiteMinder environment "${environment}". `
            + 'Reconnect the account and choose Production or Pre-production.');
    }
    return ENVIRONMENTS[environment];
};

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    // An empty result set is ordinary: an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with a missing key
    // stays under the right header. The columns are the union of the keys of all records:
    // SiteMinder leaves out fields a publisher did not send.
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

/**
 * Turn an HTTP error into an error with SiteMinder's own message. The API answers errors as
 * { name, message }, { code, message } or { errors: [{ message, ... }] }.
 * @param {object} context
 * @param {Error} err
 * @returns {Error}
 */
const toApiError = (context, err) => {

    const response = err && err.response;
    if (!response) {
        return err;
    }
    const status = response.status;
    const body = response.data;
    let detail = '';
    if (body && typeof body === 'object') {
        if (Array.isArray(body.errors)) {
            detail = body.errors
                .map(item => (item && (item.message || item.code)) || '')
                .filter(Boolean)
                .join('; ');
        }
        detail = detail || body.message || body.name || body.code || '';
    } else if (typeof body === 'string') {
        detail = body;
    }
    detail = String(detail).slice(0, 300);
    const reference = response.headers
        && (response.headers['x-sm-reference-id'] || response.headers['X-SM-REFERENCE-ID']);
    const hint = STATUS_HINTS[status] || 'SiteMinder API request failed.';
    const message = `${hint} (HTTP ${status}${detail ? ': ' + detail : ''}`
        + `${reference ? ', reference ' + reference : ''})`;
    const error = CANCEL_STATUSES.includes(status) ? cancelError(context, message) : new Error(message);
    error.response = { status, data: response.data };
    return error;
};

const lib = {

    ENVIRONMENTS,
    BASE_PATH,
    RESERVATION_EVENT,
    FORBIDDEN_CREDENTIAL_CHARACTERS,
    MAX_RANGE_DAYS,

    isEmpty,
    cancelError,
    account,
    apiOrigin,
    toApiError,
    toCsv,

    /**
     * What a reservation listener stores instead of the endpoint password, and what the route
     * computes from the WS-Security header of a pushed message. A SHA-256 over both values, so
     * the comparison is one fixed-length, constant-time check.
     * @param {string} username
     * @param {string} password
     * @returns {string} 64 hex characters
     */
    credentialHash(username, password) {

        return crypto.createHash('sha256')
            .update(JSON.stringify([String(username), String(password)]))
            .digest('hex');
    },

    /**
     * Compare two credential hashes in constant time.
     * @param {string} a
     * @param {string} b
     * @returns {boolean}
     */
    safeEqual(a, b) {

        if (typeof a !== 'string' || typeof b !== 'string') {
            return false;
        }
        const left = Buffer.from(a, 'utf8');
        const right = Buffer.from(b, 'utf8');
        return left.length === right.length && crypto.timingSafeEqual(left, right);
    },

    /**
     * Proof that a reservation handed to a trigger came through the reservation endpoint with
     * the account's endpoint credentials. A trigger is reachable on its own webhook URL too, which
     * needs no credentials; without this proof anybody who learned that URL could post a made-up
     * reservation straight into the flow. The key is derived from the credentials and stored
     * nowhere: the route computes it from the message it authenticated, the trigger from its
     * account.
     * @param {string} username
     * @param {string} password
     * @param {object} reservation a mapped reservation
     * @returns {string} 64 hex characters
     */
    deliveryProof(username, password, reservation) {

        const key = crypto.createHash('sha256')
            .update(JSON.stringify(['delivery-proof', String(username), String(password)]))
            .digest();
        const source = reservation || {};
        const message = JSON.stringify([
            source.reservationId, source.hotelCode, source.status, source.echoToken, source.messageTimestamp
        ].map(value => (value === undefined || value === null ? '' : String(value))));
        return crypto.createHmac('sha256', key).update(message).digest('hex');
    },

    /**
     * Why the endpoint credentials of an account cannot be used, or undefined when they can.
     * SiteMinder's own password policy is enforced because the endpoint is public and the
     * password is its only protection.
     * @param {string} username
     * @param {string} password
     * @returns {string|undefined}
     */
    endpointCredentialsProblem(username, password) {

        if (isEmpty(username) || isEmpty(password)) {
            return 'Endpoint Username and Endpoint Password must be filled in together.';
        }
        if (username !== username.trim() || password !== password.trim()) {
            return 'Endpoint Username and Endpoint Password must not start or end with a space.';
        }
        if (FORBIDDEN_CREDENTIAL_CHARACTERS.test(username) || FORBIDDEN_CREDENTIAL_CHARACTERS.test(password)) {
            return 'Endpoint Username and Endpoint Password must not contain the characters < > & " \'. '
                + 'SiteMinder cannot send them.';
        }
        if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password)
            || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
            return 'Endpoint Password must have at least 12 characters with an uppercase letter, a lowercase '
                + 'letter, a number and a special character (SiteMinder\'s password policy).';
        }
        return undefined;
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
     * Hotel codes from the "Hotel Codes" property of a trigger: one code, or several separated
     * by commas or line breaks.
     * @param {object} context
     * @param {string|string[]} value
     * @returns {string[]} at least one code, no duplicates
     */
    parseHotelCodes(context, value) {

        const parts = Array.isArray(value) ? value : String(value === undefined || value === null ? '' : value).split(/[,\n]/);
        const codes = [...new Set(parts.map(item => String(item).trim()).filter(Boolean))];
        if (!codes.length) {
            throw cancelError(context, 'Hotel Codes is required!');
        }
        const tooLong = codes.find(code => code.length > MAX_CODE_LENGTH);
        if (tooLong) {
            throw cancelError(context, `A hotel code must not be longer than ${MAX_CODE_LENGTH} characters.`);
        }
        return codes;
    },

    /**
     * A publisher, hotel, room type or rate plan code for a URL path. Encoded as one path segment;
     * "." and ".." are refused because a URL parser would resolve them to another path.
     * @param {object} context
     * @param {*} value
     * @param {string} label human readable name for the error message
     * @returns {string} the encoded segment
     */
    pathSegment(context, value, label) {

        const code = isEmpty(value) ? '' : String(value).trim();
        if (!code) {
            throw cancelError(context, `${label} is required!`);
        }
        if (code.length > MAX_CODE_LENGTH || code === '.' || code === '..') {
            throw cancelError(context, `${label} is not a valid code: "${code.slice(0, 60)}".`);
        }
        return encodeURIComponent(code);
    },

    /**
     * A calendar date (YYYY-MM-DD) from a date input. A value that starts with a date is taken
     * as written, so "2026-12-01T00:00:00+01:00" stays the 1st of December in every time zone.
     * An empty value is today in UTC: the API requires a start date, and "from today" is what a
     * scheduled flow usually wants.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @param {Date} [now] for tests
     * @returns {string}
     */
    toDateOnly(context, value, label, now = new Date()) {

        if (isEmpty(value)) {
            return now.toISOString().slice(0, 10);
        }
        const text = String(value).trim();
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/);
        if (match) {
            const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
            if (date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3])) {
                return `${match[1]}-${match[2]}-${match[3]}`;
            }
            throw cancelError(context, `${label} is not a valid date: "${text}".`);
        }
        const date = new Date(/^\d{11,}$/.test(text) ? Number(text) : text);
        if (Number.isNaN(date.getTime())) {
            throw cancelError(context, `${label} is not a valid date: "${text}".`);
        }
        return date.toISOString().slice(0, 10);
    },

    /**
     * The "Number of Days" input: 1 to 30, the limit of one request.
     * @param {object} context
     * @param {*} value
     * @returns {number}
     */
    toRange(context, value) {

        if (isEmpty(value)) {
            return 1;
        }
        const number = Number(value);
        if (!Number.isInteger(number) || number < 1 || number > MAX_RANGE_DAYS) {
            throw cancelError(context,
                `Number of Days must be a whole number between 1 and ${MAX_RANGE_DAYS}, got "${value}".`);
        }
        return number;
    },

    /**
     * The one place that turns a connected account into request headers.
     * @param {object} context
     * @returns {object}
     */
    authHeaders(context) {

        const { apiToken } = account(context);
        if (!apiToken) {
            throw cancelError(context, 'The connected SiteMinder account has no API token. Availability and '
                + 'rates need the Bearer token from the SMX Partner Portal: reconnect the account and fill in API Token.');
        }
        return { Authorization: `Bearer ${apiToken}` };
    },

    /**
     * GET a resource of the availability and rates API with the connected account. The URL is
     * built from the fixed origin of the account's environment and encoded path segments, so the
     * token cannot be sent anywhere else.
     * @param {object} context
     * @param {object} options { segments, params }
     * @param {string[]} options.segments already encoded path segments after /inventory/v1
     * @param {object} [options.params] query parameters
     * @returns {Promise<*>} the response body
     */
    async request(context, { segments, params }) {

        const url = `${apiOrigin(context)}${BASE_PATH}/${segments.join('/')}`;
        const options = {
            method: 'GET',
            url,
            headers: { Accept: 'application/json', ...lib.authHeaders(context) }
        };
        if (params && Object.keys(params).length) {
            options.params = params;
        }
        try {
            const response = await context.httpRequest(options);
            return response.data;
        } catch (err) {
            throw toApiError(context, err);
        }
    },

    /**
     * GET a collection and make sure the answer is an array.
     * @param {object} context
     * @param {object} options { segments, params, label }
     * @returns {Promise<Array>}
     */
    async fetchList(context, { segments, params, label }) {

        const data = await lib.request(context, { segments, params });
        if (!Array.isArray(data)) {
            throw new Error(`SiteMinder returned an unexpected answer for ${label}.`);
        }
        return data;
    },

    /**
     * GET a single resource and make sure the answer is an object, so that a component never
     * sends an empty message.
     * @param {object} context
     * @param {object} options { segments, label }
     * @returns {Promise<object>}
     */
    async fetchObject(context, { segments, label }) {

        const data = await lib.request(context, { segments });
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error(`SiteMinder returned an unexpected answer for ${label}.`);
        }
        return data;
    },

    /**
     * The path of a hotel: publishers/{publisherCode}/hotels/{hotelCode}.
     * @param {object} context
     * @param {object} input { publisherCode, hotelCode }
     * @returns {string[]}
     */
    hotelSegments(context, { publisherCode, hotelCode }) {

        return [
            'publishers', lib.pathSegment(context, publisherCode, 'Publisher'),
            'hotels', lib.pathSegment(context, hotelCode, 'Hotel')
        ];
    },

    /**
     * The first name of a multi-language list ([{ lang, name }]), English preferred.
     * @param {Array} entries
     * @param {string} field 'name' or 'description'
     * @returns {string|undefined}
     */
    localized(entries, field) {

        if (!Array.isArray(entries) || !entries.length) {
            return undefined;
        }
        const english = entries.find(entry => entry && entry.lang === 'en' && entry[field]);
        const first = english || entries.find(entry => entry && entry[field]);
        return first ? first[field] : undefined;
    },

    /**
     * A room type or rate plan with a plain "name" and "description" next to the multi-language
     * lists, so that a flow does not have to dig into an array for the usual case.
     * @param {object} item
     * @returns {object}
     */
    withLocalizedName(item) {

        const source = item && typeof item === 'object' ? item : {};
        const result = { ...source };
        const name = lib.localized(source.names, 'name');
        const description = lib.localized(source.descriptions, 'description');
        if (name !== undefined) {
            result.name = name;
        }
        if (description !== undefined) {
            result.description = description;
        }
        return result;
    },

    /**
     * Cache the result of fn(). The designer fires source calls in concurrent bursts; the lock
     * lets the first call fill the cache for the rest.
     * @param {object} context
     * @param {object} keyParts every input that shapes the result
     * @param {Function} fn
     * @returns {Promise<*>}
     */
    async callCached(context, keyParts, fn) {

        // The token is part of the key (hashed), so two accounts never share an entry.
        const { environment, apiToken } = account(context);
        const key = 'siteminder-' + crypto.createHash('sha256')
            .update(JSON.stringify({ ...keyParts, environment, apiToken }))
            .digest('hex');
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
     * Answer a dropdown source call: cached, and an error shows an empty dropdown (the code can
     * still be typed) instead of an error popup.
     * @param {object} context
     * @param {object} keyParts
     * @param {Function} fn async () => Array
     * @returns {Promise<*>}
     */
    async sendSource(context, keyParts, fn) {

        let result;
        try {
            result = await lib.callCached(context, keyParts, fn);
        } catch (err) {
            result = [];
        }
        return context.sendJson({ result }, 'out');
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the API origin of
     * the account's environment and refuse anything that would send the token somewhere else.
     * Resolving through the WHATWG URL parser and comparing the origin also rejects
     * protocol-relative input such as "//example.com/x".
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/inventory/v1/publishers') or absolute URL on the API host
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const origin = apiOrigin(context);
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
     * Which of the reservation triggers a pushed reservation belongs to.
     *
     * SMX sends the whole reservation after every change and has no "new or modified" flag. The
     * rule below is read off the samples of the Reservations reference (Commit, Modify, Cancel):
     * - ResStatus "Cancelled" is a cancellation;
     * - a reservation without LastModifyDateTime, or with one equal to CreateDateTime, is new;
     * - everything else is an update (changed stay, In-house, Checked-Out, No-show, Redacted …).
     * @param {object} reservation a mapped reservation (soap.js mapReservation)
     * @returns {'new'|'updated'|'cancelled'}
     */
    classifyReservation(reservation) {

        const status = String((reservation && reservation.status) || '').toLowerCase();
        if (status === 'cancelled' || status === 'canceled') {
            return 'cancelled';
        }
        const created = reservation && reservation.createdAt;
        const modified = reservation && reservation.lastModifiedAt;
        if (!modified) {
            return 'new';
        }
        if (created) {
            const createdMs = Date.parse(created);
            const modifiedMs = Date.parse(modified);
            if (created === modified
                || (!Number.isNaN(createdMs) && !Number.isNaN(modifiedMs) && createdMs === modifiedMs)) {
                return 'new';
            }
        }
        return 'updated';
    },

    /**
     * start() of every reservation trigger: register this flow for the hotels it names. The
     * listener carries a hash of the account's endpoint credentials; the route delivers a pushed
     * message only to listeners whose hash matches the credentials SiteMinder sent.
     * @param {object} context
     * @returns {Promise<void>}
     */
    async addReservationListener(context) {

        const { soapUsername, soapPassword } = account(context);
        const problem = isEmpty(soapUsername) && isEmpty(soapPassword)
            ? 'The connected SiteMinder account has no endpoint credentials. Reservation triggers need the '
                + 'Endpoint Username and Endpoint Password you gave SiteMinder: reconnect the account and fill them in.'
            : lib.endpointCredentialsProblem(soapUsername, soapPassword);
        if (problem) {
            throw cancelError(context, problem);
        }
        const hotelCodes = lib.parseHotelCodes(context, context.properties.hotelCodes);
        await context.addListener(RESERVATION_EVENT, {
            credentialHash: lib.credentialHash(soapUsername, soapPassword),
            hotelCodes
        });
    },

    /**
     * stop() of every reservation trigger.
     * @param {object} context
     * @returns {Promise<void>}
     */
    async removeReservationListener(context) {

        await context.removeListener(RESERVATION_EVENT);
    },

    /**
     * receive() of every reservation trigger: send the pushed reservation when it is of the
     * wanted kind. The hotel is checked again here; the route already filtered by it.
     * @param {object} context
     * @param {Function} accept (reservation) => boolean
     * @returns {Promise<void>}
     */
    async receiveReservation(context, accept) {

        const webhook = context.messages && context.messages.webhook;
        const reservation = webhook && webhook.content && webhook.content.data;
        if (!reservation || typeof reservation !== 'object' || !reservation.reservationId) {
            return;
        }
        // Only what the reservation endpoint delivered for this account's credentials. A request
        // sent straight to this trigger's webhook URL carries no valid proof and is dropped.
        const { soapUsername, soapPassword } = account(context);
        const { deliveryProof, ...output } = reservation;
        if (isEmpty(soapUsername) || isEmpty(soapPassword)
            || !lib.safeEqual(deliveryProof, lib.deliveryProof(soapUsername, soapPassword, output))) {
            return;
        }
        const hotelCodes = lib.parseHotelCodes(context, context.properties.hotelCodes);
        if (!hotelCodes.includes(output.hotelCode)) {
            return;
        }
        if (!accept(output)) {
            return;
        }
        await context.sendJson(output, 'out');
    },

    // What test() of every reservation trigger throws. SMX has no endpoint to read a reservation,
    // so there is no real sample to show, and a made-up one would match nothing.
    NO_TEST_SAMPLE: 'Flow Test Mode is not available for this trigger: SiteMinder only pushes '
        + 'reservations and has no API to read one, so there is no real sample to show. Start the flow and '
        + 'create or change a reservation in the hotel\'s system to see it arrive.',

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
