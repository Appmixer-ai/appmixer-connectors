'use strict';

const crypto = require('crypto');
const pathModule = require('path');

// Nuki Web API (https://api.nuki.io/, guide at https://docs.nuki.io/guide/). Endpoints are appended
// directly to the origin, there is no version segment.
const API_BASE_URL = 'https://api.nuki.io';

const DEFAULT_PREFIX = 'nuki-objects-export';

// The API allows 4 requests per second, 100 per minute and 1000 per hour and answers 429 until the
// window expires (https://docs.nuki.io/guide/endpoints/rate-limits/). The answer names no wait, so a
// 429 is retried twice after a short pause: enough for the per-second window, not for the others.
const MAX_RETRIES = 2;
const RETRY_WAIT_MS = 1500;

// Statuses a retry cannot fix. 401 is among them on purpose: an API token does not expire, so a 401
// means a wrong token or a missing scope, and the API counts failed attempts (429).
const CANCEL_STATUSES = [400, 401, 402, 403, 404, 405, 409, 426];

const STATUS_HINTS = {
    400: 'Nuki rejected the request as invalid.',
    401: 'Nuki did not accept the API token. The token is wrong or deleted, or it lacks the scope this '
        + 'operation needs.',
    402: 'Nuki answered "payment required": the account or the device has no active subscription for '
        + 'this operation (for guest access, Smart Hosting).',
    // Nuki answers 403, not 404, for a device ID that is not in the account of the token.
    403: 'Nuki denied access. The device or record does not exist in the Nuki Web account of this API token, '
        + 'or the token is not allowed to use it.',
    404: 'Nuki did not find this device or record.',
    405: 'Nuki does not allow this operation on this device.',
    409: 'Nuki reported a conflict with an existing record (for a keypad code: the code is already used '
        + 'on this keypad).',
    423: 'The device or record is locked by another operation that is still running. Try again later.',
    426: 'Nuki answered "upgrade required": the account needs a subscription or plan that covers this '
        + 'operation.',
    429: 'Nuki rate limit reached (4 requests per second, 100 per minute, 1000 per hour).'
};

// Authorization types (SmartlockAuth.type in the API reference).
const AUTH_TYPE_APP = 0;
const AUTH_TYPE_KEYPAD_CODE = 13;

// Weekday bitmask values of allowedWeekDays (https://docs.nuki.io/guide/overview/concepts/#weekdays).
const WEEKDAY_BITS = {
    monday: 64,
    tuesday: 32,
    wednesday: 16,
    thursday: 8,
    friday: 4,
    saturday: 2,
    sunday: 1
};

// How a created authorization is looked up, because PUT /smartlock/{id}/auth answers 204 with no body.
// Two quick checks inside the request, then one check a minute (the shortest delay the engine
// schedules) until the deadline.
const QUICK_LOOKUP_DELAYS_MS = [2000, 4000];
const LOOKUP_INTERVAL_MS = 60 * 1000;
const LOOKUP_DEADLINE_MS = 5 * 60 * 1000;

// GET /smartlock/log and GET /smartlock/{id}/log return at most 50 entries per request. A trigger
// check reads up to 4 pages (200 entries) when everything on a page is new.
const LOG_PAGE_SIZE = 50;
const LOG_MAX_PAGES = 4;

const cancelError = (context, message) => {

    return context.CancelError ? new context.CancelError(message) : new Error(message);
};

const isEmpty = (value) => value === undefined || value === null || value === '';

/**
 * The one place that turns a connected account into request headers.
 * Components read the token from context.auth, auth.js callbacks from the context itself.
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    const token = context.auth && context.auth.apiKey ? context.auth.apiKey : context.apiKey;
    return { 'Authorization': 'Bearer ' + String(token || '').trim() };
};

/**
 * Turn an HTTP error into an error with Nuki's own message. The API answers errors as
 * { detailMessage: "..." }. Errors a retry cannot fix become CancelError.
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
        detail = body.detailMessage || body.message || body.error || '';
    } else if (typeof body === 'string') {
        detail = body.slice(0, 300);
    }
    const hint = STATUS_HINTS[status] || 'Nuki API request failed.';
    const message = `${hint} (HTTP ${status}${detail ? ': ' + detail : ''})`;
    const error = CANCEL_STATUSES.includes(status) ? cancelError(context, message) : new Error(message);
    error.response = { status, data: response.data };
    return error;
};

const lib = {

    API_BASE_URL,
    AUTH_TYPE_APP,
    AUTH_TYPE_KEYPAD_CODE,
    WEEKDAY_BITS,
    QUICK_LOOKUP_DELAYS_MS,
    LOOKUP_INTERVAL_MS,
    LOOKUP_DEADLINE_MS,
    LOG_PAGE_SIZE,
    LOG_MAX_PAGES,

    authHeaders,

    /**
     * Wait. A method of the lib so that tests can replace it.
     * @param {number} ms
     * @returns {Promise<void>}
     */
    sleep(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Call the Nuki Web API with the connected account. The URL is always built from the fixed API
     * origin, so the token cannot be sent anywhere else.
     * @param {object} context
     * @param {object} options { method, path, params, data } path starts with "/" and is already encoded
     * @returns {Promise<*>} the response body
     */
    async request(context, { method = 'GET', path, params, data }) {

        const options = {
            method,
            url: API_BASE_URL + path,
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
                const status = err && err.response && err.response.status;
                if (status === 429 && attempt < MAX_RETRIES) {
                    await lib.sleep(RETRY_WAIT_MS * (attempt + 1));
                    continue;
                }
                throw toApiError(context, err);
            }
        }
    },

    /**
     * Drop undefined, null and empty-string values (query parameters, request bodies).
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
     * A numeric ID (smartlock, account user) for a URL path or a body. Nuki IDs are integers; anything
     * else is refused so that the value cannot change the path of the request.
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
     * The ID of an authorization or a log entry: a hexadecimal string (24 characters in practice).
     * @param {object} context
     * @param {*} value
     * @param {string} label human readable name for the error message
     * @returns {string}
     */
    requireHexId(context, value, label) {

        const id = isEmpty(value) ? '' : String(value).trim();
        if (!id) {
            throw cancelError(context, `${label} is required!`);
        }
        if (!/^[0-9a-f]{1,64}$/i.test(id)) {
            throw cancelError(context, `${label} must be a hexadecimal ID such as 68b1422f9c3a4e17a584f104, got "${id}".`);
        }
        return id;
    },

    /**
     * An optional integer input (it may arrive as a string from a variable).
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {number|undefined}
     */
    optionalInteger(context, value, label) {

        if (isEmpty(value)) {
            return undefined;
        }
        const number = Number(value);
        if (!Number.isInteger(number)) {
            throw cancelError(context, `${label} must be a whole number, got "${value}".`);
        }
        return number;
    },

    /**
     * A date-time input as the API expects it: UTC, YYYY-MM-DDTHH:mm:ss.SSSZ.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {string|undefined}
     */
    toApiDate(context, value, label) {

        if (isEmpty(value)) {
            return undefined;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw cancelError(context, `${label} is not a valid date: "${value}".`);
        }
        return date.toISOString();
    },

    /**
     * A time of day as minutes from midnight, the unit of allowedFromTime / allowedUntilTime.
     * Accepts "HH:mm" or the number of minutes.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {number|undefined}
     */
    toMinutesFromMidnight(context, value, label) {

        if (isEmpty(value)) {
            return undefined;
        }
        const text = String(value).trim();
        const match = text.match(/^(\d{1,2}):(\d{2})$/);
        let minutes;
        if (match) {
            const hours = Number(match[1]);
            const mins = Number(match[2]);
            minutes = hours <= 24 && mins <= 59 ? hours * 60 + mins : NaN;
        } else if (/^\d{1,4}$/.test(text)) {
            minutes = Number(text);
        } else {
            minutes = NaN;
        }
        if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
            throw cancelError(context, `${label} must be a time such as 09:00 or minutes from midnight (0-1440), got "${value}".`);
        }
        return minutes;
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
     * Weekday names to the allowedWeekDays bitmask (Monday 64 ... Sunday 1). No days means no
     * restriction, which the API expresses by leaving the field out.
     * @param {object} context
     * @param {string|string[]} input
     * @returns {number|undefined}
     */
    toWeekdayMask(context, input) {

        if (isEmpty(input) || (Array.isArray(input) && !input.length)) {
            return undefined;
        }
        const days = lib.normalizeMultiselectInput(input, context, 'Allowed Weekdays');
        let mask = 0;
        for (const day of days) {
            const bit = WEEKDAY_BITS[String(day).toLowerCase()];
            if (!bit) {
                throw cancelError(context, `Allowed Weekdays contains an unknown day: "${day}".`);
            }
            mask |= bit;
        }
        return mask || undefined;
    },

    /**
     * Check a keypad code against Nuki's rules: exactly 6 digits, digits 1-9 only, not starting
     * with 12 (https://docs.nuki.io/guide/overview/concepts/#keypad-codes).
     * @param {object} context
     * @param {*} value
     * @returns {number} the code as the integer the API expects
     */
    requireKeypadCode(context, value) {

        const code = isEmpty(value) ? '' : String(value).trim();
        if (!/^[1-9]{6}$/.test(code)) {
            throw cancelError(context, 'Keypad Code must have exactly 6 digits and use the digits 1-9 only (no 0).');
        }
        if (code.startsWith('12')) {
            throw cancelError(context, 'Keypad Code must not start with 12.');
        }
        return Number(code);
    },

    /**
     * A random keypad code that follows Nuki's rules. Nuki does not generate codes itself.
     * Uniqueness on the keypad is checked by the caller against the existing authorizations.
     * @returns {number}
     */
    generateKeypadCode() {

        for (;;) {
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += String(crypto.randomInt(1, 10));
            }
            if (!code.startsWith('12')) {
                return Number(code);
            }
        }
    },

    /**
     * The fields of an authorization that define when it is valid, from component inputs.
     * @param {object} context
     * @param {object} input component inputs
     * @returns {object} only the fields that were set
     */
    buildAccessWindow(context, input) {

        const from = lib.toApiDate(context, input.allowedFromDate, 'Allowed From');
        const until = lib.toApiDate(context, input.allowedUntilDate, 'Allowed Until');
        if (from && until && from >= until) {
            throw cancelError(context, 'Allowed Until must be later than Allowed From.');
        }
        return lib.clean({
            allowedFromDate: from,
            allowedUntilDate: until,
            allowedWeekDays: lib.toWeekdayMask(context, input.allowedWeekDays),
            allowedFromTime: lib.toMinutesFromMidnight(context, input.allowedFromTime, 'Allowed From Time'),
            allowedUntilTime: lib.toMinutesFromMidnight(context, input.allowedUntilTime, 'Allowed Until Time')
        });
    },

    /**
     * One device: GET /smartlock/{smartlockId}.
     * @param {object} context
     * @param {string} smartlockId digits
     * @returns {Promise<object>}
     */
    getSmartlock(context, smartlockId) {

        return lib.request(context, { path: `/smartlock/${smartlockId}` });
    },

    /**
     * All authorizations of one device: GET /smartlock/{smartlockId}/auth. The API does not page
     * this list (a device stores at most 200 authorizations).
     * @param {object} context
     * @param {string} smartlockId digits
     * @param {object} [params] { types }
     * @returns {Promise<Array>}
     */
    async listAuthorizations(context, smartlockId, params = {}) {

        const data = await lib.request(context, {
            path: `/smartlock/${smartlockId}/auth`,
            params: lib.clean(params)
        });
        if (!Array.isArray(data)) {
            throw new Error('Nuki returned an unexpected answer for the list of authorizations.');
        }
        return data;
    },

    /**
     * Find the authorization a create request produced: an ID that did not exist before the
     * request, the same type, and the same keypad code (unique on a keypad) or the same account
     * user. The name only breaks a tie, so a name Nuki stores differently (trimmed, shortened)
     * does not hide the authorization.
     * @param {Array} authorizations current authorizations of the device
     * @param {object} wanted { type, name, code, accountUserId, knownIds }
     * @returns {object|undefined}
     */
    matchCreatedAuthorization(authorizations, { type, name, code, accountUserId, knownIds = [] }) {

        const known = new Set(knownIds);
        const matches = authorizations.filter(auth => {
            if (!auth || !auth.id || known.has(auth.id) || Number(auth.type) !== Number(type)) {
                return false;
            }
            if (Number(type) === AUTH_TYPE_KEYPAD_CODE) {
                return Number(auth.code) === Number(code);
            }
            return Number(auth.accountUserId) === Number(accountUserId);
        });
        // Same name first, then newest first, should the same request have been sent twice.
        matches.sort((a, b) => {
            const byName = Number(b.name === name) - Number(a.name === name);
            return byName || String(b.creationDate || '').localeCompare(String(a.creationDate || ''));
        });
        return matches[0];
    },

    /**
     * Create an authorization and deliver it on the "out" port with its ID.
     *
     * PUT /smartlock/{smartlockId}/auth answers 204 with no body as soon as the payload is valid.
     * The authorization is therefore looked up in the list of the device: twice within a few
     * seconds, then once a minute through context.setTimeout until LOOKUP_DEADLINE_MS. When it does
     * not show up by then, the request is reported on the "notConfirmed" port.
     *
     * What "out" proves is that Nuki Web lists the authorization. Nuki offers no synchronous
     * confirmation that the device has stored it.
     * @param {object} context
     * @param {object} options { smartlockId, body, generateCode } body is the SmartlockAuthCreate
     *   payload; with generateCode a keypad code that is free on the device is put into it
     * @returns {Promise<*>}
     */
    async createAuthorization(context, { smartlockId, body, generateCode = false }) {

        const before = await lib.listAuthorizations(context, smartlockId, { types: String(body.type) });

        if (body.type === AUTH_TYPE_KEYPAD_CODE) {
            const usedCodes = new Set(before.map(auth => Number(auth.code)));
            if (generateCode) {
                do {
                    body.code = lib.generateKeypadCode();
                } while (usedCodes.has(body.code));
            } else if (usedCodes.has(Number(body.code))) {
                throw cancelError(context,
                    `Keypad code ${body.code} is already used on this device. A code must be unique on a keypad.`);
            }
        }

        await lib.request(context, { method: 'PUT', path: `/smartlock/${smartlockId}/auth`, data: body });

        const lookup = {
            smartlockId,
            type: body.type,
            name: body.name,
            code: body.code,
            accountUserId: body.accountUserId,
            knownIds: before.map(auth => auth.id),
            deadline: Date.now() + LOOKUP_DEADLINE_MS
        };

        // The create request is sent. A failed lookup must not fail the message from here on: the
        // engine would run it again and send a second create request. The lookup continues later.
        for (const delay of QUICK_LOOKUP_DELAYS_MS) {
            await lib.sleep(delay);
            let found;
            try {
                found = await lib.findCreatedAuthorization(context, lookup);
            } catch (err) {
                break;
            }
            if (found) {
                return context.sendJson(found, 'out');
            }
        }

        return context.setTimeout({ lookup }, LOOKUP_INTERVAL_MS);
    },

    /**
     * One lookup of a created authorization.
     * @param {object} context
     * @param {object} lookup see createAuthorization
     * @returns {Promise<object|undefined>}
     */
    async findCreatedAuthorization(context, lookup) {

        const params = { types: String(lookup.type) };
        const authorizations = await lib.listAuthorizations(context, lookup.smartlockId, params);
        return lib.matchCreatedAuthorization(authorizations, lookup);
    },

    /**
     * The continuation of createAuthorization, called with context.messages.timeout.
     * @param {object} context
     * @returns {Promise<*>}
     */
    async continueAuthorizationLookup(context) {

        const { lookup } = context.messages.timeout.content || {};
        if (!lookup || !lookup.smartlockId) {
            return;
        }

        // A failed read throws: repeating this message only repeats the read.
        const found = await lib.findCreatedAuthorization(context, lookup);
        if (found) {
            return context.sendJson(found, 'out');
        }

        if (Date.now() >= lookup.deadline) {
            return context.sendJson(lib.clean({
                smartlockId: Number(lookup.smartlockId),
                type: lookup.type,
                name: lookup.name,
                code: lookup.code,
                accountUserId: lookup.accountUserId,
                waitedMinutes: Math.round(LOOKUP_DEADLINE_MS / 60000)
            }), 'notConfirmed');
        }

        return context.setTimeout({ lookup }, LOOKUP_INTERVAL_MS);
    },

    /**
     * One authorization: GET /smartlock/{smartlockId}/auth/{id}.
     * @param {object} context
     * @param {string} smartlockId digits
     * @param {string} authorizationId hexadecimal ID
     * @returns {Promise<object>}
     */
    getAuthorization(context, smartlockId, authorizationId) {

        return lib.request(context, { path: `/smartlock/${smartlockId}/auth/${authorizationId}` });
    },

    /**
     * The name of an authorization: required, at most 32 characters (the API's limit).
     * @param {object} context
     * @param {*} value
     * @returns {string}
     */
    requireAuthorizationName(context, value) {

        const name = isEmpty(value) ? '' : String(value).trim();
        if (!name) {
            throw cancelError(context, 'Name is required!');
        }
        if (name.length > 32) {
            throw cancelError(context, `Name can have at most 32 characters, got ${name.length}.`);
        }
        return name;
    },

    /**
     * Refuse to write to a device Nuki cannot reach. serverState 0 is ok; 4 is offline, 1-3 mean the
     * device is not (or no longer correctly) registered with Nuki Web. A device that reports no
     * serverState is let through.
     * @param {object} context
     * @param {object} smartlock the answer of GET /smartlock/{smartlockId}
     * @param {string} smartlockId
     */
    assertOnline(context, smartlock, smartlockId) {

        const serverState = smartlock && smartlock.serverState;
        if (typeof serverState !== 'number' || serverState === 0) {
            return;
        }
        const reason = serverState === 4 ? 'offline' : `not connected to Nuki Web correctly (server state ${serverState})`;
        throw cancelError(context,
            `The device ${smartlockId} is ${reason}, so Nuki cannot deliver the request to it. Nothing was sent.`);
    },

    /**
     * Send an action (lock, unlock, ...) to a device. The API answers 204 as soon as the request is
     * valid and executes it afterwards, so the output says what was sent and what the device
     * reported before, not what the device did.
     * @param {object} context
     * @param {object} options { smartlockId, path, data } path is "/action", "/action/lock" or "/action/unlock"
     * @returns {Promise<*>}
     */
    async sendDeviceAction(context, { smartlockId, path, data }) {

        const smartlock = await lib.getSmartlock(context, smartlockId);
        lib.assertOnline(context, smartlock, smartlockId);

        await lib.request(context, { method: 'POST', path: `/smartlock/${smartlockId}${path}`, data });

        const state = (smartlock && smartlock.state) || {};
        return context.sendJson(lib.clean({
            smartlockId: Number(smartlockId),
            name: smartlock && smartlock.name,
            previousLockState: state.state,
            previousDoorState: state.doorState
        }), 'out');
    },

    /**
     * One page of the activity log, newest entries first: GET /smartlock/{smartlockId}/log, or
     * GET /smartlock/log for all devices. The API returns at most 50 entries per request.
     * @param {object} context
     * @param {object} options { smartlockId, params } smartlockId is optional (digits)
     * @returns {Promise<Array>}
     */
    async fetchLogEntries(context, { smartlockId, params = {} }) {

        const data = await lib.request(context, {
            path: smartlockId ? `/smartlock/${smartlockId}/log` : '/smartlock/log',
            params: lib.clean({ limit: LOG_PAGE_SIZE, ...params })
        });
        if (!Array.isArray(data)) {
            throw new Error('Nuki returned an unexpected answer for the activity log.');
        }
        return data;
    },

    /**
     * The polling body of the New Log Entry trigger.
     *
     * State: { initialized, known, floor }. "known" holds the IDs of the entries read by the previous
     * check. An entry fires when its ID is not known and it is newer than "floor", the date of the
     * oldest entry the previous check read. The floor is what keeps an old entry from firing when it
     * slides into the newest page; an entry a device reports late still fires as long as it is newer
     * than the floor. When a whole page is new, older pages are read (the "id" cursor of the API)
     * until a known entry, the floor or LOG_MAX_PAGES is reached.
     * @param {object} context
     * @param {object} options { smartlockId, action }
     * @returns {Promise<{ emit: Array, state: object|null }>} state null means "keep the stored state"
     */
    async pollLogEntries(context, { smartlockId, action }) {

        const { initialized, floor } = context.state || {};
        const known = new Set(Array.isArray((context.state || {}).known) ? context.state.known : []);
        const time = (entry) => Date.parse(entry.date) || 0;
        const floorTime = floor ? Date.parse(floor) || 0 : 0;

        const collected = [];
        const seen = new Set();
        let truncated = false;
        let cursor;

        for (let page = 0; page < LOG_MAX_PAGES; page++) {
            const entries = (await lib.fetchLogEntries(context, {
                smartlockId,
                params: { action, id: cursor }
            })).filter(entry => entry && entry.id && !seen.has(entry.id));

            entries.forEach(entry => seen.add(entry.id));
            collected.push(...entries);
            truncated = entries.length >= LOG_PAGE_SIZE;

            // The first check only records what exists. Later checks go on to older pages only while
            // everything read so far is new.
            const reachedKnown = entries.some(entry => known.has(entry.id) || (floorTime && time(entry) <= floorTime));
            if (!initialized || !truncated || reachedKnown) {
                break;
            }
            cursor = entries.reduce((oldest, entry) => (time(entry) < time(oldest) ? entry : oldest), entries[0]).id;
        }

        // A degraded answer (nothing, while entries are known) must not become the state: the next
        // check would fire the whole page again.
        if (!collected.length && known.size) {
            return { emit: [], state: null };
        }

        collected.sort((a, b) => time(a) - time(b));
        const oldest = collected[0];
        const state = {
            initialized: true,
            known: collected.map(entry => entry.id),
            floor: oldest && truncated ? oldest.date : null
        };

        if (!initialized) {
            return { emit: [], state };
        }

        const emit = collected.filter(entry => !known.has(entry.id) && (!floorTime || time(entry) > floorTime));
        return { emit, state };
    },

    /**
     * What the Smartlock State Changed trigger compares between two checks.
     * @param {object} smartlock
     * @returns {object}
     */
    stateSnapshot(smartlock) {

        const state = (smartlock && smartlock.state) || {};
        const pick = (value) => (value === undefined ? null : value);
        return {
            lockState: pick(state.state),
            doorState: pick(state.doorState),
            batteryCritical: pick(state.batteryCritical),
            serverState: pick(smartlock && smartlock.serverState)
        };
    },

    /**
     * Cache the result of fn(). The designer fires source calls in concurrent bursts; the lock lets
     * the first call fill the cache for the rest.
     * @param {object} context
     * @param {object} keyParts every input that shapes the result
     * @param {Function} fn
     * @returns {Promise<*>}
     */
    async callCached(context, keyParts, fn) {

        const key = 'nuki-' + crypto.createHash('sha256')
            .update(JSON.stringify({ ...keyParts, token: context.auth.apiKey }))
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
     * Resolve a user supplied endpoint (relative path or absolute URL) against the Nuki API origin
     * and refuse anything that would send the account's token somewhere else. Resolving through the
     * WHATWG URL parser and comparing the origin also rejects protocol-relative input such as
     * "//example.com/x".
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/smartlock') or absolute URL on the API host
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const input = String(url).trim();
        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(input) || input.startsWith('//') || input.startsWith('\\')
            ? input
            : `${input.startsWith('/') ? '' : '/'}${input}`;

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw cancelError(context, `API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw cancelError(context, 'API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== API_BASE_URL) {
            throw cancelError(context, `API Endpoint Path must target ${API_BASE_URL}, got ${parsed.origin}.`);
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

module.exports = lib;
