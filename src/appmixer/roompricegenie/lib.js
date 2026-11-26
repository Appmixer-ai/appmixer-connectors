'use strict';

const crypto = require('crypto');

// RoomPriceGenie "Open API" (https://postman.roompricegenie.com/).
//
// Two levels of credentials:
// - partner level, in the connector configuration (Backoffice, appmixer:roompricegenie): the API
//   base URL RoomPriceGenie hands over at onboarding, and the Partner API Key that goes into
//   X-API-Key of every request. The plugin route (routes.js) has no connected account and needs
//   both to read RoomPriceGenie's signing keys, so they cannot live in an account.
// - property level, in the connected account: the partner's property code and the client_id and
//   client_secret RoomPriceGenie issued for that property. They are exchanged for a Bearer token.

// The production host is not published, so the base URL is configuration. It is still never
// trusted as typed: every request of this connector carries the Partner API Key, the client secret
// or an access token, so the host must be a RoomPriceGenie one.
const ALLOWED_HOST_SUFFIX = '.roompricegenie.com';

const TOKEN_PATH = '/integrations/token/';
const JWKS_PATH = '/integrations/jwk/';
const EVENT_PATH = '/integrations/api/v1/event/';
const ACCOUNT_PATH = '/integrations/api/v1/connect/accounts/';

const RATES_EVENT = 'rates.update';
const RESTRICTIONS_EVENT = 'restrictions.update';
const PUBLIC_KEY_EVENT = 'public_key';

const REQUEST_TIMEOUT = 30 * 1000;
// An access token is renewed this long before it expires.
const TOKEN_EXPIRY_MARGIN = 5 * 60 * 1000;
const DEFAULT_ACCESS_TOKEN_LIFETIME = 60 * 60;
const DEFAULT_REFRESH_TOKEN_LIFETIME = 7 * 24 * 60 * 60;
const MAX_TOKEN_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const MAX_RESERVATIONS = 200;

// Answers that will not change when the same request is sent again.
const CANCEL_STATUSES = [400, 401, 403, 404, 405, 409, 413, 415, 422];

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * A CancelError in a component, a plain Error where the context has none (auth.js, routes.js).
 * @param {object} context
 * @param {string} message
 * @returns {Error}
 */
const cancelError = (context, message) => {

    return context && context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * Check an API base URL and return its origin. HTTPS only, a host under roompricegenie.com, the
 * default port, no credentials, no path, query or fragment. The value is checked as it is stored,
 * with the WHATWG URL parser, so "https://x.roompricegenie.com@evil.example" and
 * "https://evil.example\.roompricegenie.com" are judged by the host a request would really go to.
 * @param {string} value
 * @returns {string} for example "https://api.roompricegenie.com"
 * @throws {Error} with a message that names the problem
 */
const resolveOrigin = (value) => {

    if (isEmpty(value) || typeof value !== 'string') {
        throw new Error('The RoomPriceGenie API base URL is not set.');
    }
    let parsed;
    try {
        parsed = new URL(value.trim());
    } catch (err) {
        throw new Error('The RoomPriceGenie API base URL is not a valid URL.');
    }
    if (parsed.protocol !== 'https:') {
        throw new Error('The RoomPriceGenie API base URL must start with https://.');
    }
    if (parsed.username || parsed.password) {
        throw new Error('The RoomPriceGenie API base URL must not contain credentials.');
    }
    if (parsed.port) {
        throw new Error('The RoomPriceGenie API base URL must not name a port.');
    }
    if (!parsed.hostname.endsWith(ALLOWED_HOST_SUFFIX) || parsed.hostname.length <= ALLOWED_HOST_SUFFIX.length) {
        throw new Error('The RoomPriceGenie API base URL must be a host under roompricegenie.com, '
            + 'for example https://api.roompricegenie.com.');
    }
    if ((parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
        throw new Error('The RoomPriceGenie API base URL must be the host only, without a path or query.');
    }
    return parsed.origin;
};

/**
 * The partner level settings from the connector configuration.
 * @param {object} context component, auth or plugin context
 * @returns {{ origin: string, partnerApiKey: string, partnerId: string }}
 */
const serviceConfig = (context) => {

    const config = (context && context.config) || {};
    const hint = ' Set "baseUrl" and "partnerApiKey" in the connector configuration (appmixer:roompricegenie).';
    let origin;
    try {
        origin = resolveOrigin(config.baseUrl);
    } catch (err) {
        throw cancelError(context, err.message + hint);
    }
    if (isEmpty(config.partnerApiKey)) {
        throw cancelError(context, 'The RoomPriceGenie Partner API Key is not set.' + hint);
    }
    return {
        origin,
        partnerApiKey: String(config.partnerApiKey).trim(),
        partnerId: isEmpty(config.partnerId) ? '' : String(config.partnerId).trim()
    };
};

/**
 * The property level fields of the connected account.
 * @param {object} context
 * @returns {{ propertyCode: string, clientId: string, clientSecret: string }}
 */
const account = (context) => {

    const auth = (context && context.auth) || {};
    const read = (value) => (isEmpty(value) ? '' : String(value).trim());
    return {
        propertyCode: read(auth.propertyCode),
        clientId: read(auth.clientId),
        clientSecret: read(auth.clientSecret)
    };
};

/**
 * The text of an error answer. RoomPriceGenie answers validation errors as
 * { errors: [{ type, loc, msg, input, ctx }] } and authentication errors as
 * { error, error_description }.
 * @param {*} body
 * @returns {string}
 */
const errorDetail = (body) => {

    let detail = '';
    if (isPlainObject(body)) {
        if (Array.isArray(body.errors)) {
            detail = body.errors
                .filter(isPlainObject)
                .map(item => [item.loc, item.msg || item.type].filter(part => !isEmpty(part)).join(': '))
                .filter(Boolean)
                .join('; ');
        }
        detail = detail || body.error_description || body.detail || body.message || body.error || '';
    } else if (typeof body === 'string') {
        detail = body;
    }
    return String(typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 500);
};

/**
 * Turn an HTTP error into an error with RoomPriceGenie's own message. The request (with its
 * credentials) is not kept on the error.
 * @param {object} context
 * @param {Error} err
 * @returns {Error}
 */
const toApiError = (context, err) => {

    const response = err && err.response;
    if (!response) {
        return new Error(`RoomPriceGenie request failed: ${(err && err.message) || 'no response'}`);
    }
    const status = response.status;
    const detail = errorDetail(response.data);
    const message = `RoomPriceGenie API request failed (HTTP ${status}${detail ? ': ' + detail : ''}).`;
    const error = CANCEL_STATUSES.includes(status) ? cancelError(context, message) : new Error(message);
    error.response = { status, data: response.data };
    return error;
};

/**
 * What to throw for a failed request. An error of the HTTP client carries the request it was made
 * for (the Partner API Key header, the client secret in the form body), so it is never passed on
 * as it is; an error this connector made itself is.
 * @param {object} context
 * @param {Error} err
 * @returns {Error}
 */
const requestError = (context, err) => {

    const fromHttpClient = err && (err.response || err.request || err.config || err.isAxiosError);
    return fromHttpClient ? toApiError(context, err) : err;
};

const lifetime = (value, fallback) => {

    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : fallback;
};

const lib = {

    ALLOWED_HOST_SUFFIX,
    TOKEN_PATH,
    JWKS_PATH,
    EVENT_PATH,
    ACCOUNT_PATH,
    RATES_EVENT,
    RESTRICTIONS_EVENT,
    PUBLIC_KEY_EVENT,
    MAX_RESERVATIONS,

    isEmpty,
    isPlainObject,
    cancelError,
    resolveOrigin,
    serviceConfig,
    account,
    toApiError,
    requestError,

    /**
     * Compare two secrets in constant time. Both are hashed first, so their lengths do not leak.
     * @param {string} a
     * @param {string} b
     * @returns {boolean}
     */
    safeEqual(a, b) {

        if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) {
            return false;
        }
        return crypto.timingSafeEqual(
            crypto.createHash('sha256').update(a).digest(),
            crypto.createHash('sha256').update(b).digest()
        );
    },

    /**
     * JSON with the keys of every object sorted, so that the same value gives the same text
     * whatever order its keys were stored in.
     * @param {*} value
     * @returns {string}
     */
    canonicalJson(value) {

        if (Array.isArray(value)) {
            return '[' + value.map(item => lib.canonicalJson(item === undefined ? null : item)).join(',') + ']';
        }
        if (isPlainObject(value)) {
            return '{' + Object.keys(value)
                .filter(key => value[key] !== undefined)
                .sort()
                .map(key => JSON.stringify(key) + ':' + lib.canonicalJson(value[key]))
                .join(',') + '}';
        }
        return JSON.stringify(value === undefined ? null : value);
    },

    /**
     * Proof that an update handed to a trigger came through the plugin route, which verified
     * RoomPriceGenie's signature. A trigger is also reachable on its own webhook URL, which needs
     * no credentials; without this proof anybody who learned that URL could post made-up prices
     * straight into a flow. The key is derived from the Partner API Key, which the route and the
     * trigger both read from the connector configuration and which is never sent to a flow. The
     * proof also covers the client id the update was delivered for, so it is of no use on the
     * trigger of another connection.
     * @param {string} partnerApiKey
     * @param {string} clientId the client_id claim of RoomPriceGenie's token; the trigger's account
     * @param {object} update the update without its proof
     * @returns {string} 64 hex characters
     */
    deliveryProof(partnerApiKey, clientId, update) {

        const key = crypto.createHash('sha256')
            .update(JSON.stringify(['roompricegenie-delivery-proof', String(partnerApiKey)]))
            .digest();
        return crypto.createHmac('sha256', key)
            .update(lib.canonicalJson([String(clientId), update]))
            .digest('hex');
    },

    /**
     * Ask the token endpoint for a token. The answer is returned as a cache record.
     * @param {object} context needs httpRequest
     * @param {{ origin: string, partnerApiKey: string }} config
     * @param {object} form the form fields of the grant
     * @returns {Promise<{ accessToken: string, expiresAt: number, refreshToken: string, refreshExpiresAt: number }>}
     */
    async requestToken(context, config, form) {

        const response = await context.httpRequest({
            method: 'POST',
            url: config.origin + TOKEN_PATH,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                'X-API-Key': config.partnerApiKey
            },
            data: new URLSearchParams(form).toString(),
            // A redirect would carry the Partner API Key and the client secret to another host.
            maxRedirects: 0,
            timeout: REQUEST_TIMEOUT
        });
        const body = response && response.data;
        if (!isPlainObject(body) || typeof body.access_token !== 'string' || !body.access_token) {
            throw new Error('RoomPriceGenie returned no access token.');
        }
        const now = Date.now();
        const hasRefreshToken = typeof body.refresh_token === 'string' && body.refresh_token !== '';
        return {
            accessToken: body.access_token,
            expiresAt: now + lifetime(body.expires_in, DEFAULT_ACCESS_TOKEN_LIFETIME) * 1000,
            refreshToken: hasRefreshToken ? body.refresh_token : '',
            refreshExpiresAt: hasRefreshToken
                ? now + lifetime(body.refresh_token_expires_in, DEFAULT_REFRESH_TOKEN_LIFETIME) * 1000
                : 0
        };
    },

    /**
     * The client credentials grant. Used when an account is connected, and when there is no
     * refresh token to use.
     * @param {object} context
     * @returns {Promise<object>} a token record
     */
    async requestTokenWithClientCredentials(context) {

        const config = serviceConfig(context);
        const { clientId, clientSecret } = account(context);
        if (!clientId || !clientSecret) {
            throw cancelError(context, 'The connected RoomPriceGenie account has no Client ID or Client Secret.');
        }
        return lib.requestToken(context, config, {
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        });
    },

    /**
     * The cache key of an account's tokens. It covers the host, the Partner API Key, the client id
     * and the client secret: an account with another secret never reads this one's token, and a
     * rotated key or secret starts with an empty cache.
     * @param {object} context
     * @returns {string}
     */
    tokenCacheKey(context) {

        const { origin, partnerApiKey } = serviceConfig(context);
        const { clientId, clientSecret } = account(context);
        return 'roompricegenie-token-' + sha256(JSON.stringify([origin, partnerApiKey, clientId, clientSecret]));
    },

    /**
     * The access token of the connected account.
     *
     * RoomPriceGenie asks partners to keep the access token (24 hours) and the refresh token (dies
     * after 7 days without use) and to renew with the refresh grant, not with new client
     * credentials requests. So both are cached; an expired access token is renewed with the
     * refresh token, and the client credentials grant is the fallback.
     * @param {object} context component context (staticCache, lock, httpRequest)
     * @param {{ rejected?: string }} [options] rejected: an access token the API just refused
     * @returns {Promise<string>}
     */
    async getAccessToken(context, { rejected } = {}) {

        const key = lib.tokenCacheKey(context);
        const usable = (record) => isPlainObject(record) && typeof record.accessToken === 'string'
            && record.accessToken !== '' && record.accessToken !== rejected
            && record.expiresAt - TOKEN_EXPIRY_MARGIN > Date.now();

        let cached = await context.staticCache.get(key);
        if (usable(cached)) {
            return cached.accessToken;
        }

        let lock;
        try {
            lock = await context.lock(key, { ttl: 60 * 1000, retryDelay: 300, maxRetryCount: 200 });
            // Another message of the same account may have renewed the token meanwhile.
            cached = await context.staticCache.get(key);
            if (usable(cached)) {
                return cached.accessToken;
            }

            let record;
            if (isPlainObject(cached) && cached.refreshToken && cached.refreshExpiresAt > Date.now()) {
                try {
                    record = await lib.requestToken(context, serviceConfig(context), {
                        grant_type: 'refresh_token',
                        client_id: account(context).clientId,
                        refresh_token: cached.refreshToken
                    });
                } catch (err) {
                    // A refused refresh token is not the end: the client credentials still work.
                    // Anything else (outage, rate limit) is not answered with more requests.
                    const status = err && err.response && err.response.status;
                    if (!status || status >= 500 || status === 429) {
                        throw toApiError(context, err);
                    }
                }
            }
            if (!record) {
                try {
                    record = await lib.requestTokenWithClientCredentials(context);
                } catch (err) {
                    throw requestError(context, err);
                }
            }
            const ttl = Math.max(record.expiresAt, record.refreshExpiresAt) - Date.now();
            await context.staticCache.set(key, record, Math.min(Math.max(ttl, 60 * 1000), MAX_TOKEN_CACHE_TTL));
            return record.accessToken;
        } finally {
            lock && await lock.unlock();
        }
    },

    /**
     * Send a request with the Partner API Key and, unless bearer is false, the access token of the
     * connected account. A 401 for a cached token is retried once with a renewed one.
     * @param {object} context
     * @param {{ method: string, url: string, headers?: object, params?: object, data?: *, bearer?: boolean }} options
     *   url must come from lib.apiUrl() or lib.resolveApiUrl()
     * @returns {Promise<object>} the HTTP response
     */
    async request(context, { method, url, headers = {}, params, data, bearer = true }) {

        const { partnerApiKey } = serviceConfig(context);
        const send = (token) => {
            const options = {
                method,
                url,
                headers: {
                    Accept: 'application/json',
                    ...headers,
                    'X-API-Key': partnerApiKey,
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                maxRedirects: 0,
                timeout: REQUEST_TIMEOUT
            };
            if (params && Object.keys(params).length > 0) {
                options.params = params;
            }
            if (data !== undefined) {
                options.data = data;
            }
            return context.httpRequest(options);
        };

        let token = bearer ? await lib.getAccessToken(context) : undefined;
        try {
            return await send(token);
        } catch (err) {
            if (!bearer || !err || !err.response || err.response.status !== 401) {
                throw toApiError(context, err);
            }
        }
        token = await lib.getAccessToken(context, { rejected: token });
        try {
            return await send(token);
        } catch (err) {
            throw toApiError(context, err);
        }
    },

    /**
     * An absolute URL of a fixed API path on the configured host.
     * @param {object} context
     * @param {string} path
     * @returns {string}
     */
    apiUrl(context, path) {

        return serviceConfig(context).origin + path;
    },

    /**
     * Send one event of the connected property to the event endpoint.
     * @param {object} context
     * @param {{ event: string, data: *, propertyCode?: string, extra?: object }} options
     * @returns {Promise<{ event: string, tracking_id: string, property_code: string }>}
     */
    async sendEvent(context, { event, data, propertyCode, extra = {} }) {

        const code = isEmpty(propertyCode) ? account(context).propertyCode : String(propertyCode).trim();
        if (!code) {
            throw cancelError(context, 'The connected RoomPriceGenie account has no Property Code.');
        }
        const body = {
            event,
            tracking_id: crypto.randomUUID(),
            property_code: code,
            ...extra,
            data
        };
        const response = await lib.request(context, {
            method: 'POST',
            url: lib.apiUrl(context, EVENT_PATH),
            headers: { 'Content-Type': 'application/json' },
            data: body
        });
        return lib.eventResult(context, body, response);
    },

    /**
     * What an event component sends out: the envelope RoomPriceGenie echoes. An answer that
     * carries errors is a failure whatever its HTTP status.
     * @param {object} context
     * @param {object} body the request body
     * @param {object} response the HTTP response
     * @returns {{ event: string, tracking_id: string, property_code: string }}
     */
    eventResult(context, body, response) {

        const answer = isPlainObject(response && response.data) ? response.data : {};
        if (Array.isArray(answer.errors) && answer.errors.length > 0) {
            throw cancelError(context, `RoomPriceGenie rejected the ${body.event} event: ${errorDetail(answer)}`);
        }
        const pick = (key) => (typeof answer[key] === 'string' && answer[key] ? answer[key] : body[key]);
        return {
            event: pick('event'),
            tracking_id: pick('tracking_id'),
            property_code: pick('property_code')
        };
    },

    /**
     * A calendar date as YYYY-MM-DD. Accepts that form and anything that starts with it (the
     * Designer's date field may add a time).
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {string}
     */
    toDate(context, value, label) {

        const text = isEmpty(value) ? '' : String(value).trim();
        const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(text);
        if (match) {
            const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
            if (date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1
                && date.getUTCDate() === Number(match[3])) {
                return `${match[1]}-${match[2]}-${match[3]}`;
            }
        }
        throw cancelError(context, `${label} must be a date in the form YYYY-MM-DD.`);
    },

    /**
     * A whole number that is not negative.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {number}
     */
    toInteger(context, value, label) {

        const number = typeof value === 'number' ? value : Number(String(value).trim());
        if (isEmpty(value) || !Number.isInteger(number) || number < 0) {
            throw cancelError(context, `${label} must be a whole number, 0 or higher.`);
        }
        return number;
    },

    /**
     * A price. RoomPriceGenie accepts no decimals and asks partners to round to the closest
     * whole number, so that is what happens here.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {number}
     */
    toPrice(context, value, label) {

        const number = typeof value === 'number' ? value : Number(String(value).trim());
        if (isEmpty(value) || !Number.isFinite(number) || number < 0) {
            throw cancelError(context, `${label} must be a number, 0 or higher.`);
        }
        return Math.round(number);
    },

    /**
     * A JSON array input: a JSON string, or an array mapped from a variable.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {object[]|undefined} undefined when the input is empty
     */
    parseJsonArray(context, value, label) {

        if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
            return undefined;
        }
        let parsed = value;
        if (typeof value === 'string') {
            try {
                parsed = JSON.parse(value);
            } catch (err) {
                throw cancelError(context, `${label} must be valid JSON.`);
            }
        }
        if (!Array.isArray(parsed) || parsed.some(item => !isPlainObject(item))) {
            throw cancelError(context, `${label} must be a JSON array of objects.`);
        }
        return parsed;
    },

    /**
     * The "data" of an availability, rates or restrictions event.
     *
     * Either the batch input is used as it is (the array RoomPriceGenie documents as "data"), or
     * one entry is built from the single fields: one room type, one date range.
     * @param {object} context
     * @param {object} input the message content
     * @param {{ label: string, withRatePlan?: boolean, values: Function }} options
     *   values(input) returns the calendar values of the single entry
     * @returns {object[]}
     */
    buildCalendarData(context, input, { label, withRatePlan = false, values }) {

        const batch = lib.parseJsonArray(context, input.data, `${label} (JSON)`);
        const singleFields = ['roomTypeCode', 'roomTypeName', 'ratePlanCode', 'ratePlanName', 'startDate', 'endDate'];
        if (batch) {
            if (singleFields.some(field => !isEmpty(input[field]))) {
                throw cancelError(context, `Fill in either ${label} (JSON) or the single fields, not both.`);
            }
            if (!batch.length) {
                throw cancelError(context, `${label} (JSON) must not be empty.`);
            }
            const hasDates = (day) => isPlainObject(day) && !isEmpty(day.start_date) && !isEmpty(day.end_date);
            batch.forEach((entry, index) => {
                const item = `${label} (JSON): item ${index + 1}`;
                if (isEmpty(entry.room_type_code) || isEmpty(entry.room_type_name)) {
                    throw cancelError(context, `${item} needs room_type_code and room_type_name.`);
                }
                if (!Array.isArray(entry.calendar) || !entry.calendar.length || !entry.calendar.every(hasDates)) {
                    throw cancelError(context, `${item} needs a calendar whose items have start_date and end_date.`);
                }
            });
            return batch;
        }

        for (const [field, name] of [['roomTypeCode', 'Room Type Code'], ['roomTypeName', 'Room Type Name'],
            ['startDate', 'Start Date'], ['endDate', 'End Date']]) {
            if (isEmpty(input[field])) {
                throw cancelError(context, `${name} is required (or fill in ${label} (JSON)).`);
            }
        }
        const startDate = lib.toDate(context, input.startDate, 'Start Date');
        const endDate = lib.toDate(context, input.endDate, 'End Date');
        if (endDate < startDate) {
            throw cancelError(context, 'End Date must be the same as Start Date or later.');
        }
        const entry = {
            room_type_code: String(input.roomTypeCode).trim(),
            room_type_name: String(input.roomTypeName).trim()
        };
        if (withRatePlan) {
            if (isEmpty(input.ratePlanCode) !== isEmpty(input.ratePlanName)) {
                throw cancelError(context, 'Fill in both Rate Plan Code and Rate Plan Name, or neither.');
            }
            if (!isEmpty(input.ratePlanCode)) {
                entry.rate_plan_code = String(input.ratePlanCode).trim();
                entry.rate_plan_name = String(input.ratePlanName).trim();
            }
        }
        const { entryValues = {}, calendarValues } = values(input);
        Object.assign(entry, entryValues);
        entry.calendar = [{ start_date: startDate, end_date: endDate, ...calendarValues }];
        return [entry];
    },

    /**
     * Resolve the endpoint of a Make API Call (a path, or a full URL) against the configured API
     * host and refuse anything that would send the credentials somewhere else. Resolving through
     * the WHATWG URL parser and comparing the origin also rejects protocol-relative input such as
     * "//example.com/x".
     * @param {object} context
     * @param {string} url
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const { origin } = serviceConfig(context);
        const input = String(url).trim();
        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(input) || input.startsWith('//') || input.startsWith('\\')
            ? input
            : `${input.startsWith('/') ? '' : '/'}${input}`;

        let parsed;
        try {
            parsed = new URL(candidate, origin);
        } catch (err) {
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
     * @param {object} context
     * @param {string|object} value
     * @param {string} label
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
        } catch (err) {
            throw cancelError(context, `${label} must be valid JSON.`);
        }
    },

    /**
     * Convert a key-value inspector input into a plain object. The Designer stores the rows as the
     * JSON string of an object ('{"Accept":"application/json"}'). A plain object and an array of
     * {key, value} rows (also as a JSON string) are accepted too, for values mapped from a variable.
     * @param {object} context
     * @param {string|object|Array<{key: string, value: *}>} value
     * @param {string} label
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
            } catch (err) {
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
     * The user's headers of a Make API Call without the ones the connector sets. The comparison
     * ignores case, so "x-api-key" cannot shadow "X-API-Key".
     * @param {object} headers
     * @param {string[]} reserved
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
     * start() of the triggers: register this flow for the property of the connected account.
     *
     * The listener carries the property code and the client id. The route delivers an update only
     * to listeners whose client id equals the client_id claim of RoomPriceGenie's signed token, so
     * a connection that merely names somebody else's property code receives nothing: its owner
     * would have to know that property's client secret to connect it.
     * @param {object} context
     * @param {string} eventName
     * @returns {Promise<void>}
     */
    async addUpdateListener(context, eventName) {

        // Fails early when the connector configuration is missing: nothing could be verified.
        serviceConfig(context);
        const { propertyCode, clientId } = account(context);
        if (!propertyCode || !clientId) {
            throw cancelError(context, 'The connected RoomPriceGenie account has no Property Code or Client ID. '
                + 'Reconnect the account.');
        }
        await context.addListener(eventName, { propertyCode, clientId });
    },

    /**
     * stop() of the triggers.
     * @param {object} context
     * @param {string} eventName
     * @returns {Promise<void>}
     */
    async removeUpdateListener(context, eventName) {

        await context.removeListener(eventName);
    },

    /**
     * receive() of the triggers: send out an update the plugin route delivered for this account's
     * property. Anything else is dropped without a word, including a request posted straight to
     * the trigger's webhook URL: it cannot carry a valid proof.
     * @param {object} context
     * @param {string} eventName
     * @returns {Promise<void>}
     */
    async receiveUpdate(context, eventName) {

        const webhook = context.messages && context.messages.webhook;
        const update = webhook && webhook.content && webhook.content.data;
        if (!isPlainObject(update)) {
            return;
        }
        const partnerApiKey = context.config && context.config.partnerApiKey;
        if (isEmpty(partnerApiKey)) {
            return;
        }
        const { propertyCode, clientId } = account(context);
        if (!clientId) {
            return;
        }
        const { deliveryProof, ...output } = update;
        if (!lib.safeEqual(deliveryProof, lib.deliveryProof(String(partnerApiKey).trim(), clientId, output))) {
            return;
        }
        if (output.event !== eventName || !propertyCode || output.property_code !== propertyCode) {
            return;
        }
        await context.sendJson(output, 'out');
    },

    // What test() of the triggers throws. RoomPriceGenie only pushes updates and has no API to
    // read one, so there is no real sample to show, and a made-up one would match nothing.
    NO_TEST_SAMPLE: 'Flow Test Mode is not available for this trigger: RoomPriceGenie only pushes updates and '
        + 'has no API to read one, so there is no real sample to show. Start the flow and upload prices from '
        + 'the RoomPriceGenie account of the property to see an update arrive.'
};

module.exports = lib;
