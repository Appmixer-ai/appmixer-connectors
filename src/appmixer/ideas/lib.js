'use strict';

const crypto = require('crypto');

// IDeaS Public API (https://developers.ideas.com/): three write-only endpoints a PMS or CRS uses
// to push reservations, group blocks and inventory into IDeaS RMS. Each call is acknowledged at
// once; the result of the processing is posted later to the URL of the "ReplyTo" header.
//
// What the documentation does not say, and how this connector deals with it:
// - The API and token hosts are not published ("Environment-specific URLs will be provided"), so
//   the base URL is part of the connected account and is checked against IDeaS-owned domains.
// - The success status is 202 on the operation pages, 201 in the request guide and 204 in the
//   response guide. Any 2xx counts as accepted.
// - The acknowledgement body is "UUID of request" on the operation pages and a JSON object in the
//   request guide. A plain string is taken as the tracker ID, anything else leaves it empty.
// - The callback is "REST PUT ... {status, description}" in the message flow diagram and
//   "POST /trackers/{trackerId} {status, messages[]}" in the Tracker API. Both are accepted.

// Hosts a credential of this connector may be sent to. The only API host the documentation names
// is api-mock-service.ideasrms.com; ideas.com is the vendor's own domain (developers.ideas.com).
// Hosts on any other domain have to be allowed by an administrator (see additionalHosts()).
const ALLOWED_HOST_SUFFIXES = ['.ideasrms.com', '.ideas.com'];

// The "Schema Validation Service" of the operation pages: a mock that checks a payload against the
// API schema. It has no token endpoint and takes no credentials, and it never calls back.
const MOCK_HOST = 'api-mock-service.ideasrms.com';

const TOKEN_PATH = '/api/uis/external_m2m/oauth2/token';
const API_PREFIX = '/api/public/v1';

const REQUEST_TIMEOUT = 60 * 1000;
const TOKEN_REQUEST_TIMEOUT = 30 * 1000;
const TOKEN_LOCK = { ttl: TOKEN_REQUEST_TIMEOUT + 15 * 1000, retryDelay: 250, maxRetryCount: 200 };

// "Token Lifetime: 60 minutes", "Maximum recommended frequency: 6 tokens per hour (one token every
// 10 minutes)", "Excessive token requests may be throttled."
const TOKEN_DEFAULT_LIFETIME_S = 3600;
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const TOKEN_BUDGET = 6;
const TOKEN_BUDGET_WINDOW_MS = 60 * 60 * 1000;
// A token the API refuses is replaced only when it is at least this old. A wrong chain or hotel
// code is refused on every message, and must not turn every message into a token request.
const TOKEN_MIN_AGE_BEFORE_REPLACE_MS = 10 * 60 * 1000;

// Answers that will not change when the same request is sent again. 408 is on the list because
// the documentation's remedy is "request data in smaller batches", and 409 because it asks to
// refresh the data first.
const CANCEL_STATUSES = [400, 401, 403, 404, 405, 408, 409, 413, 415, 422];

const STATUS_HINTS = {
    400: 'IDeaS rejected the request as invalid.',
    401: 'IDeaS did not accept the access token.',
    403: 'IDeaS refused the request. The access token is no longer valid, or the Client ID is not '
        + 'allowed to send data for this client code and property code.',
    408: 'IDeaS timed out processing the request. Send the data in smaller batches.',
    409: 'IDeaS reports a conflict: the data has changed. Refresh it and send it again.',
    429: 'IDeaS rejected the request because too many were sent.'
};

const MAX_INVENTORIES = 1000;
const MAX_CORRELATION_ID_LENGTH = 128;

// A reply is accepted for this long after its data was sent. IDeaS publishes no processing time.
const REPLY_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;
const REPLY_TOKEN_VERSION = 1;
const MAX_REPLY_TOKEN_LENGTH = 2048;
const MAX_REPLY_MESSAGES = 100;
const MAX_REPLY_TEXT_LENGTH = 2000;

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const base64url = (value) => Buffer.from(value).toString('base64url');

/**
 * A CancelError in a component, a plain Error where the context has none (auth.js, routes.js).
 * @param {object} context
 * @param {string} message
 * @returns {Error}
 */
const cancelError = (context, message) => {

    return context && context.CancelError ? new context.CancelError(message) : new Error(message);
};

// ---------------------------------------------------------------------------------------------
// Hosts
// ---------------------------------------------------------------------------------------------

/**
 * Hosts an administrator allowed on top of the built-in domains: "additionalApiHosts" of the
 * connector configuration, exact host names separated by commas. Anything that is not a plain DNS
 * name (an IP address, a wildcard, a URL) is ignored.
 * @param {object} context
 * @returns {string[]}
 */
const additionalHosts = (context) => {

    const raw = context && context.config && context.config.additionalApiHosts;
    if (typeof raw !== 'string') {
        return [];
    }
    return raw.split(',')
        .map(item => item.trim().toLowerCase())
        .filter(item => /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(item));
};

const isAllowedHost = (context, hostname) => {

    const host = String(hostname || '').toLowerCase();
    if (!host) {
        return false;
    }
    if (ALLOWED_HOST_SUFFIXES.some(suffix => host.endsWith(suffix) && host.length > suffix.length)) {
        return true;
    }
    return additionalHosts(context).includes(host);
};

/**
 * Parse a URL of the connected account and refuse everything a credential must not be sent to:
 * anything but HTTPS, credentials in the URL, a port, a host that is not IDeaS's. The WHATWG
 * parser decides what the host is, so "https://x.ideasrms.com@evil.example" and
 * "https://evil.example/.ideasrms.com" are judged by the host a request would really go to.
 * @param {object} context
 * @param {string} value
 * @param {string} label
 * @returns {URL}
 */
const parseIdeasUrl = (context, value, label) => {

    if (typeof value !== 'string' || isEmpty(value)) {
        throw cancelError(context, `${label} is required.`);
    }
    let parsed;
    try {
        parsed = new URL(value.trim());
    } catch (err) {
        throw cancelError(context, `${label} is not a valid URL.`);
    }
    if (parsed.protocol !== 'https:') {
        throw cancelError(context, `${label} must start with https://.`);
    }
    if (parsed.username || parsed.password) {
        throw cancelError(context, `${label} must not contain credentials.`);
    }
    if (parsed.port) {
        throw cancelError(context, `${label} must not name a port.`);
    }
    if (!isAllowedHost(context, parsed.hostname)) {
        throw cancelError(context, `${label} must be an IDeaS host (under ideasrms.com or ideas.com), got `
            + `"${parsed.hostname}". If IDeaS issued you a URL on another domain, an administrator has to add its `
            + 'host to "additionalApiHosts" in the connector configuration (appmixer:ideas).');
    }
    if (parsed.search || parsed.hash) {
        throw cancelError(context, `${label} must not contain a query or a fragment.`);
    }
    return parsed;
};

/**
 * The origin of the API from the Base URL of the account. The host alone, or the host followed by
 * the API prefix (/api/public/v1), which is dropped.
 * @param {object} context
 * @param {string} value
 * @returns {string} for example "https://api-mock-service.ideasrms.com"
 */
const resolveOrigin = (context, value) => {

    const parsed = parseIdeasUrl(context, value, 'Base URL');
    const path = parsed.pathname.replace(/\/+$/, '');
    if (path !== '' && path !== API_PREFIX) {
        throw cancelError(context, 'Base URL must be the host only, for example https://api.example.ideasrms.com, '
            + 'without a path.');
    }
    return parsed.origin;
};

/**
 * The token endpoint: the Token URL of the account when IDeaS issued a separate one, otherwise
 * the documented path on the API host.
 * @param {object} context
 * @param {string} origin
 * @param {string} [value]
 * @returns {string}
 */
const resolveTokenUrl = (context, origin, value) => {

    if (isEmpty(value)) {
        return origin + TOKEN_PATH;
    }
    const parsed = parseIdeasUrl(context, value, 'Token URL');
    if (parsed.pathname === '/' || parsed.pathname === '') {
        throw cancelError(context, 'Token URL must be the full URL of the token endpoint, ending with '
            + '/oauth2/token.');
    }
    return parsed.origin + parsed.pathname;
};

/**
 * The connected account, checked. Components and auth.js (through an adapter) keep the fields in
 * context.auth.
 * @param {object} context
 * @returns {{ origin: string, tokenUrl: string, clientId: string, clientSecret: string,
 *   clientCode: string, propertyCode: string, mock: boolean }}
 */
const account = (context) => {

    const auth = (context && context.auth) || {};
    const read = (value) => (isEmpty(value) ? '' : String(value).trim());
    const origin = resolveOrigin(context, auth.baseUrl);
    const mock = new URL(origin).hostname === MOCK_HOST;
    return {
        origin,
        // The mock has no token endpoint; nothing is ever requested from it.
        tokenUrl: mock ? '' : resolveTokenUrl(context, origin, auth.tokenUrl),
        clientId: read(auth.clientId),
        clientSecret: read(auth.clientSecret),
        clientCode: read(auth.clientCode),
        propertyCode: read(auth.propertyCode),
        mock
    };
};

// ---------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------

/**
 * The text of an error answer. The API answers { error, exception, message, path, status,
 * timestamp }, the token endpoint (OAuth) { error, error_description }, the mock a problem
 * document { title, detail }.
 * @param {*} body
 * @returns {string}
 */
const errorDetail = (body) => {

    let detail = '';
    if (isPlainObject(body)) {
        detail = body.message || body.error_description || body.detail || body.title || body.error || '';
    } else if (typeof body === 'string') {
        detail = body;
    }
    return String(typeof detail === 'string' ? detail : JSON.stringify(detail)).trim().slice(0, 500);
};

/**
 * The problems the schema validation service reports in its "sl-violations" header, as one line.
 * @param {*} header a JSON array of { location: string[], message: string }
 * @returns {string} empty when there are none
 */
const schemaViolations = (header) => {

    if (typeof header !== 'string' || !header.trim()) {
        return '';
    }
    let list;
    try {
        list = JSON.parse(header);
    } catch (err) {
        return '';
    }
    if (!Array.isArray(list) || !list.length) {
        return '';
    }
    const text = list.slice(0, 20).map(item => {
        const location = isPlainObject(item) && Array.isArray(item.location) ? item.location.join('.') : '';
        const message = isPlainObject(item) && typeof item.message === 'string' ? item.message : '';
        return [location, message].filter(Boolean).join(': ');
    }).filter(Boolean).join('; ');
    return text.slice(0, 1500);
};

/**
 * Turn an error of the HTTP client into an error with IDeaS's own message. The client's error
 * carries the request it was made for (the Authorization header, the client secret in the form
 * body), so nothing of it but the status, the answer and the Retry-After header is kept.
 * @param {object} context
 * @param {Error} err
 * @param {object} [hints] status → text, replacing the default hint
 * @returns {Error}
 */
const toApiError = (context, err, hints = {}) => {

    if (err && err.ideasApiError) {
        return err;
    }
    const response = err && err.response;
    if (!response) {
        const fromHttpClient = err && (err.request || err.config || err.isAxiosError);
        if (!fromHttpClient && err instanceof Error) {
            return err;
        }
        const reason = (err && (err.code || err.message)) || 'no response';
        const error = new Error(`IDeaS request failed: ${String(reason).slice(0, 200)}`);
        error.ideasApiError = true;
        return error;
    }
    const status = response.status;
    const headers = response.headers || {};
    const violations = schemaViolations(headers['sl-violations']);
    if (violations) {
        // The schema validation service (a Stoplight Prism mock) lists what it found wrong in a
        // header and answers 500 "Cannot find serializer". Sending it again will not help.
        const error = cancelError(context, `The IDeaS schema validation service rejected the payload: ${violations}`);
        error.response = { status, data: response.data };
        error.ideasApiError = true;
        return error;
    }
    const detail = errorDetail(response.data);
    const hint = hints[status] || STATUS_HINTS[status] || 'IDeaS API request failed.';
    const retryAfter = status === 429 ? (headers['retry-after'] || headers['Retry-After']) : undefined;
    const message = `${hint} (HTTP ${status}${detail ? ': ' + detail : ''})`
        + (retryAfter ? ` Retry after ${String(retryAfter).slice(0, 40)}.` : '');
    const error = CANCEL_STATUSES.includes(status) ? cancelError(context, message) : new Error(message);
    error.response = { status, data: response.data };
    error.ideasApiError = true;
    return error;
};

// ---------------------------------------------------------------------------------------------
// Payload schemas (the request bodies of the three operation pages)
// ---------------------------------------------------------------------------------------------

const str = (required = false) => ({ type: 'string', required });
const int = (required = false) => ({ type: 'integer', required });
const num = (required = false) => ({ type: 'number', required });
const bool = (required = false) => ({ type: 'boolean', required });
const date = (required = false) => ({ type: 'date', required });
const dateTime = (required = false) => ({ type: 'date-time', required });
const oneOf = (values, required = false) => ({ type: 'enum', values, required });
const list = (items, { required = false, min = 0 } = {}) => ({ type: 'array', items, required, min });
const obj = (fields, required = false) => ({ type: 'object', fields, required });

const SERVICE_FIELDS = {
    serviceName: str(true),
    serviceValue: num(true),
    inclusive: bool(true),
    startDate: date(true),
    endDate: date(true)
};

const ROOM_TYPE_INVENTORY = obj({
    roomTypeCode: str(true),
    roomTypeCapacity: int(true),
    roomsNotAvailableMaintenance: int(true),
    roomsNotAvailableOther: int(),
    roomsSold: int(true),
    transientSold: int(),
    groupSold: int()
});

const SCHEMAS = {

    // https://developers.ideas.com/reservation-api/operations/savereservations
    reservations: {
        clientCode: str(true),
        propertyCode: str(true),
        correlationId: str(true),
        reservationId: str(true),
        status: oneOf(['RESERVED', 'CANCELLED', 'IN_HOUSE', 'CHECKED_OUT', 'NO_SHOW'], true),
        bookingDateTime: dateTime(true),
        lastModifiedDateTime: dateTime(true),
        cancellationDateTime: dateTime(),
        cancellationReason: str(),
        lastBookedPropertyCode: str(),
        channel: str(),
        confirmationNumber: str(),
        multiReservationId: str(),
        nationality: str(),
        numberOfRooms: int(true),
        primarySharer: bool(),
        shareId: str(),
        sharers: list(str()),
        roomStays: list(obj({
            arrivalDate: date(true),
            departureDate: date(true),
            roomTypeCode: str(true),
            bookedRoomTypeCode: str(),
            marketSegmentCode: str(true),
            groupBlockCode: str(),
            sourceBookingCode: str(),
            roomNumber: str(),
            numberOfAdults: int(true),
            numberOfChildren: int(true),
            numberOfInfants: int(),
            currencyCode: str(true),
            rateCode: str(true),
            rates: list(obj({
                startDate: date(true),
                endDate: date(true),
                rateValue: num(true),
                grossRateValue: num()
            }), { required: true, min: 1 }),
            childAgeBuckets: list(obj({
                minimumAge: num(true),
                maximumAge: num(true),
                numberOfChildren: num(true)
            }), { min: 1 }),
            services: list(obj({
                ...SERVICE_FIELDS,
                reservationPackage: bool(),
                roomRevenuePackage: bool()
            }))
        }), { required: true, min: 1 }),
        profiles: list(obj({
            id: str(true),
            name: str(true),
            profileType: oneOf(['TRAVEL_AGENT', 'COMPANY'], true),
            context: str()
        }), { min: 1 }),
        stayRevenue: obj({
            daily: list(obj({
                occupancyDate: date(true),
                netRoomRevenue: num(true),
                netTotalRevenue: num(true),
                netFoodRevenue: num(),
                netBeverageRevenue: num(),
                netOtherRevenue: num(),
                grossTotalRevenue: num(),
                ticketPrice: num(),
                netTicketPrice: num()
            }), { required: true }),
            summary: obj({
                totalTicketRevenue: num(),
                netTotalTicketRevenue: num()
            })
        }, true)
    },

    // https://developers.ideas.com/group-api/operations/savegroupblockmasters
    groups: {
        clientCode: str(true),
        propertyCode: str(true),
        correlationId: str(true),
        groupCode: str(true),
        action: oneOf(['COMMIT', 'MODIFY', 'CANCEL']),
        name: str(true),
        description: str(),
        masterGroupCode: str(),
        groupStatusCode: oneOf(['DEFINITE', 'TENTATIVE', 'CANCELLED', 'PROSPECT', 'LOST/REGRET'], true),
        marketSegmentCode: str(true),
        startDate: date(true),
        endDate: date(true),
        groupTypeCode: oneOf(['TRANSIENT', 'GROUP'], true),
        bookingDate: date(true),
        lastModifiedDateTime: dateTime(true),
        pickupTypeCode: oneOf(['INDV', 'RMLIST']),
        cancelDate: date(),
        salesPerson: str(),
        cutoffDays: int(),
        cutoffDate: date(),
        rateCode: str(),
        groupBlocks: list(obj({
            occupancyDate: date(true),
            roomTypeCode: str(true),
            blocks: int(true),
            pickup: int(true),
            originalBlocks: int(),
            currencyCode: str(true),
            singlePersonRate: num(true),
            twoPersonRate: num(),
            threePersonRate: num(),
            fourPersonRate: num(),
            singlePersonOccupancy: num(),
            twoPersonOccupancy: num(),
            threePersonOccupancy: num(),
            fourPersonOccupancy: num(),
            extraAdultRate: num(),
            extraChildRate: num(),
            singlePersonTotalRate: num(),
            twoPersonTotalRate: num(),
            threePersonTotalRate: num(),
            fourPersonTotalRate: num(),
            netRoomRevenue: num(),
            totalRoomRevenue: num()
        })),
        services: list(obj(SERVICE_FIELDS))
    },

    // https://developers.ideas.com/inventory-api/operations/postinventoriesforaproperty
    inventories: {
        clientCode: str(true),
        propertyCode: str(true),
        correlationId: str(true),
        createDateTime: dateTime(true),
        occupancyDate: date(true),
        roomTypeInventories: list(ROOM_TYPE_INVENTORY, { required: true, min: 1 }),
        virtualRoomTypeInventories: list(ROOM_TYPE_INVENTORY)
    }
};

const KINDS = {
    reservations: { path: '/reservations', label: 'Reservations' },
    groups: { path: '/groups', label: 'Group Blocks' },
    inventories: { path: '/inventories', label: 'Inventories', max: MAX_INVENTORIES }
};

const RFC3339 = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;

const isCalendarDate = (year, month, day) => {

    const value = new Date(Date.UTC(year, month - 1, day));
    return value.getUTCFullYear() === year && value.getUTCMonth() === month - 1 && value.getUTCDate() === day;
};

/**
 * Check one value against its schema and bring it into the type the API documents: a number typed
 * as text ("68.87", as a flow variable often is) becomes a number, "true" a boolean, a date with a
 * time its date. Anything that cannot be meant that way is reported with its path.
 * @param {*} value not undefined, null or empty
 * @param {object} spec
 * @param {string} path
 * @param {Function} report (path, problem) => never
 * @returns {*}
 */
const normalizeValue = (value, spec, path, report) => {

    switch (spec.type) {
        case 'string':
            if (typeof value === 'string') return value;
            if (typeof value === 'number' || typeof value === 'boolean') return String(value);
            return report(path, 'must be text.');
        case 'integer':
        case 'number': {
            const text = typeof value === 'string' ? value.trim() : value;
            const number = typeof text === 'number' ? text
                : (typeof text === 'string' && /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text) ? Number(text) : NaN);
            if (!Number.isFinite(number)) return report(path, 'must be a number.');
            if (spec.type === 'integer' && !Number.isInteger(number)) return report(path, 'must be a whole number.');
            return number;
        }
        case 'boolean': {
            if (typeof value === 'boolean') return value;
            const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
            if (text === 'true') return true;
            if (text === 'false') return false;
            return report(path, 'must be true or false.');
        }
        case 'date': {
            const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})(?:$|[Tt ])/.exec(value.trim());
            if (match && isCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))) {
                return `${match[1]}-${match[2]}-${match[3]}`;
            }
            return report(path, 'must be a date in the form YYYY-MM-DD.');
        }
        case 'date-time': {
            const text = typeof value === 'string' ? value.trim() : '';
            if (RFC3339.test(text) && !Number.isNaN(Date.parse(text))) return text;
            return report(path, 'must be a date and time with a time zone, for example 2026-11-22T04:35:19Z.');
        }
        case 'enum': {
            const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
            if (spec.values.includes(text)) return text;
            return report(path, `must be one of ${spec.values.join(', ')}.`);
        }
        case 'array': {
            if (!Array.isArray(value)) return report(path, 'must be a list.');
            if (value.length < spec.min) {
                return report(path, `needs at least ${spec.min} item${spec.min === 1 ? '' : 's'}.`);
            }
            return value.map((item, index) => {
                const itemPath = `${path}[${index}]`;
                if (item === undefined || item === null) return report(itemPath, 'must not be empty.');
                return normalizeValue(item, spec.items, itemPath, report);
            });
        }
        case 'object':
            if (!isPlainObject(value)) return report(path, 'must be an object.');
            // eslint-disable-next-line no-use-before-define
            return normalizeObject(value, spec.fields, path, report);
        default:
            return value;
    }
};

/**
 * Check an object against the fields of its schema. Fields the schema does not know are passed on
 * unchanged. An optional field that is null or an empty text is left out: the documentation's
 * samples send null ("cancellationDateTime": null), but the published schema does not allow it,
 * and the schema validation service rejects the sample as it is ("must be string").
 * @param {object} input
 * @param {object} fields
 * @param {string} path
 * @param {Function} report
 * @returns {object}
 */
const normalizeObject = (input, fields, path, report) => {

    const output = { ...input };
    for (const [name, spec] of Object.entries(fields)) {
        const fieldPath = path ? `${path}.${name}` : name;
        const value = input[name];
        const blankText = typeof value === 'string' && value.trim() === '';
        if (value === undefined || value === null || blankText) {
            if (spec.required) {
                report(fieldPath, 'is required.');
            }
            if (blankText || value === null) {
                delete output[name];
            }
            continue;
        }
        output[name] = normalizeValue(value, spec, fieldPath, report);
    }
    return output;
};

// ---------------------------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------------------------

/**
 * Where the access token and the count of token requests are kept: the connector's service state,
 * shared by all flows (see getAccessToken()). The service state has no TTL; the entries are
 * overwritten, one pair per set of credentials, and expired ones are ignored. Falls back to the
 * static cache where a context has no service state.
 * @param {object} context
 * @returns {{ get: Function, set: Function }|null}
 */
const tokenStore = (context) => {

    const service = context && context.service;
    if (service && typeof service.stateGet === 'function' && typeof service.stateSet === 'function') {
        return {
            get: (key) => service.stateGet(key),
            set: (key, value) => service.stateSet(key, value)
        };
    }
    if (context && context.staticCache) {
        return {
            get: (key) => context.staticCache.get(key),
            set: (key, value, ttl) => context.staticCache.set(key, value, ttl)
        };
    }
    return null;
};

const tokenKey = (acc) => {

    return crypto.createHmac('sha256', String(acc.clientSecret))
        .update(JSON.stringify(['appmixer.ideas.token-store', String(acc.tokenUrl), String(acc.clientId)]))
        .digest();
};

/**
 * Encrypt a token for the shared store (AES-256-GCM, key derived from the client secret).
 * @param {object} acc
 * @param {{ token: string, issuedAt: number, expiresAt: number }} record
 * @returns {{ v: number, iv: string, data: string, tag: string, expiresAt: number }}
 */
const sealToken = (acc, record) => {

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', tokenKey(acc), iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(record), 'utf8'), cipher.final()]);
    return {
        v: 1,
        iv: iv.toString('base64'),
        data: data.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        expiresAt: record.expiresAt
    };
};

/**
 * Decrypt a stored token. Anything that does not decrypt with this account's secret is no token.
 * @param {object} acc
 * @param {*} sealed
 * @returns {{ token: string, issuedAt: number, expiresAt: number }|null}
 */
const openToken = (acc, sealed) => {

    if (!isPlainObject(sealed) || sealed.v !== 1 || typeof sealed.data !== 'string') {
        return null;
    }
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', tokenKey(acc), Buffer.from(sealed.iv, 'base64'));
        decipher.setAuthTag(Buffer.from(sealed.tag, 'base64'));
        const text = Buffer.concat([decipher.update(Buffer.from(sealed.data, 'base64')), decipher.final()]).toString('utf8');
        const record = JSON.parse(text);
        return isPlainObject(record) && typeof record.token === 'string' && Number.isFinite(record.expiresAt)
            ? record
            : null;
    } catch (err) {
        return null;
    }
};

// ---------------------------------------------------------------------------------------------
// Reply tokens
// ---------------------------------------------------------------------------------------------

class ReplyTokenError extends Error {

    constructor(code) {
        super(`Invalid reply token (${code}).`);
        this.name = 'ReplyTokenError';
        this.code = code;
    }
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const replyKey = (acc) => {

    return crypto.createHmac('sha256', String(acc.clientSecret))
        .update(JSON.stringify(['appmixer.ideas.reply-token', REPLY_TOKEN_VERSION, String(acc.clientId)]))
        .digest();
};

const replyMac = (acc, flowId, componentId, body) => {

    return crypto.createHmac('sha256', replyKey(acc))
        .update(JSON.stringify([String(flowId), String(componentId), body]))
        .digest('base64url');
};

const lib = {

    ALLOWED_HOST_SUFFIXES,
    MOCK_HOST,
    TOKEN_PATH,
    API_PREFIX,
    TOKEN_BUDGET,
    TOKEN_BUDGET_WINDOW_MS,
    TOKEN_EXPIRY_MARGIN_MS,
    TOKEN_MIN_AGE_BEFORE_REPLACE_MS,
    MAX_INVENTORIES,
    MAX_CORRELATION_ID_LENGTH,
    REPLY_VALIDITY_MS,
    MAX_REPLY_TOKEN_LENGTH,
    KINDS,
    SCHEMAS,
    ID_PATTERN,
    ReplyTokenError,

    sealToken,
    openToken,
    isEmpty,
    isPlainObject,
    cancelError,
    isAllowedHost,
    resolveOrigin,
    resolveTokenUrl,
    account,
    toApiError,

    // -----------------------------------------------------------------------------------------
    // Access token
    // -----------------------------------------------------------------------------------------

    /**
     * Ask the token endpoint for a token: OAuth 2.0 client credentials, the credentials in a form
     * body (https://developers.ideas.com/developer-guide/authentication/). The URL comes from
     * account(), which accepts IDeaS hosts only, and a redirect is not followed, so the client
     * secret cannot be sent anywhere else.
     * @param {object} context needs httpRequest
     * @param {object} [acc] the result of account()
     * @returns {Promise<{ token: string, issuedAt: number, expiresAt: number }>}
     */
    async requestToken(context, acc = account(context)) {

        if (acc.mock) {
            throw cancelError(context, 'The IDeaS schema validation service issues no access tokens.');
        }
        if (!acc.clientId || !acc.clientSecret) {
            throw cancelError(context, 'The connected IDeaS account has no Client ID or Client Secret.');
        }
        let response;
        try {
            response = await context.httpRequest({
                method: 'POST',
                url: acc.tokenUrl,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
                data: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: acc.clientId,
                    client_secret: acc.clientSecret
                }).toString(),
                maxRedirects: 0,
                timeout: TOKEN_REQUEST_TIMEOUT
            });
        } catch (err) {
            const refused = 'IDeaS did not accept the Client ID and Client Secret of the connected account.';
            throw toApiError(context, err, {
                400: 'IDeaS rejected the token request.',
                401: refused,
                403: refused,
                404: 'IDeaS has no token endpoint at this URL. Check the Base URL (and the Token URL) of the '
                    + 'connected account.'
            });
        }
        const body = response && response.data;
        if (!isPlainObject(body) || typeof body.access_token !== 'string' || !body.access_token) {
            throw new Error('IDeaS returned no access token.');
        }
        const expiresIn = Number(body.expires_in);
        const lifetime = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : TOKEN_DEFAULT_LIFETIME_S;
        const issuedAt = Date.now();
        return { token: body.access_token, issuedAt, expiresAt: issuedAt + lifetime * 1000 };
    },

    /**
     * The cache key of an account's token. The token URL is part of it: the same Client ID in the
     * test and the production environment are two tokens.
     * @param {object} acc
     * @returns {string}
     */
    tokenCacheKey(acc) {

        return 'ideas-token-' + sha256(JSON.stringify([acc.tokenUrl, acc.clientId, acc.clientSecret]));
    },

    /**
     * The access token of the connected account. IDeaS issues it for an hour, has no refresh token
     * and asks for at most 6 token requests an hour, so the token is shared by every component and
     * every flow of the same credentials. It is kept in the connector's service state, not in the
     * static cache: the static cache belongs to one flow and is emptied when the flow starts or
     * stops, so with it every running flow (and every restart) would request tokens of its own.
     * The service state is a database shared by all users of the connector, so the entry is keyed
     * by a hash of the credentials and the token is stored encrypted with a key derived from the
     * client secret (sealToken()): it is of no use to anyone who does not hold the secret anyway.
     * The lock (namespaced to this connector by the engine) keeps concurrent messages from each
     * requesting their own. Every request to the token endpoint is counted, also a refused one,
     * and the seventh within an hour is not sent.
     * @param {object} context
     * @param {{ replace?: string }} [options] replace: the token the API just refused, to be
     *   replaced unless another message already did so
     * @returns {Promise<{ token: string, issuedAt: number, expiresAt: number, cached: boolean }>}
     */
    async getAccessToken(context, { replace } = {}) {

        const acc = account(context);
        const store = tokenStore(context);
        if (!store || !context.lock) {
            // auth.js: the auth context has no store and no lock.
            return { ...(await lib.requestToken(context, acc)), cached: false };
        }

        const key = lib.tokenCacheKey(acc);
        const budgetKey = key + '-requests';
        let lock;
        try {
            // The engine's default lock lives 20 s and is waited for 6 s; a token request may take
            // up to TOKEN_REQUEST_TIMEOUT. Hold it longer than that, and let concurrent messages wait
            // for the token instead of failing or requesting their own.
            lock = await context.lock(key, TOKEN_LOCK);
            const now = Date.now();
            const cached = openToken(acc, await store.get(key));
            const usable = cached && cached.expiresAt - TOKEN_EXPIRY_MARGIN_MS > now;
            if (usable && cached.token !== replace) {
                return { ...cached, cached: true };
            }

            const stored = await store.get(budgetKey);
            const requests = (Array.isArray(stored) ? stored : [])
                .filter(time => Number.isFinite(time) && now - time < TOKEN_BUDGET_WINDOW_MS);
            if (requests.length >= TOKEN_BUDGET) {
                const next = new Date(Math.min(...requests) + TOKEN_BUDGET_WINDOW_MS).toISOString();
                throw new Error(`This IDeaS account has requested ${TOKEN_BUDGET} access tokens within an hour, the `
                    + `most IDeaS recommends. No further token is requested before ${next}.`);
            }
            requests.push(now);
            await store.set(budgetKey, requests, TOKEN_BUDGET_WINDOW_MS);

            const fresh = await lib.requestToken(context, acc);
            const ttl = Math.max(60 * 1000, fresh.expiresAt - fresh.issuedAt - TOKEN_EXPIRY_MARGIN_MS);
            await store.set(key, sealToken(acc, fresh), ttl);
            return { ...fresh, cached: false };
        } finally {
            if (lock) {
                await lock.unlock();
            }
        }
    },

    /**
     * Send a request to the API with the access token of the connected account. A cached token the
     * API refuses (401 or 403) is replaced once, when it is old enough (see
     * TOKEN_MIN_AGE_BEFORE_REPLACE_MS), and the request repeated. The schema validation service
     * takes no token and gets none.
     * @param {object} context
     * @param {{ method: string, url: string, headers?: object, params?: object, data?: * }} options
     *   url must come from lib.apiUrl() or lib.resolveApiUrl()
     * @returns {Promise<object>} the HTTP response
     */
    async request(context, { method, url, headers = {}, params, data }) {

        const acc = account(context);
        const send = (token) => {
            const options = {
                method,
                url,
                headers: {
                    Accept: 'application/json',
                    ...headers,
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                // A redirect would carry the access token to another host.
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

        if (acc.mock) {
            try {
                return await send();
            } catch (err) {
                throw toApiError(context, err);
            }
        }

        let token = await lib.getAccessToken(context);
        try {
            return await send(token.token);
        } catch (err) {
            const status = err && err.response && err.response.status;
            const refused = status === 401 || status === 403;
            if (!refused || !token.cached || Date.now() - token.issuedAt < TOKEN_MIN_AGE_BEFORE_REPLACE_MS) {
                throw toApiError(context, err);
            }
        }
        token = await lib.getAccessToken(context, { replace: token.token });
        try {
            return await send(token.token);
        } catch (err) {
            throw toApiError(context, err);
        }
    },

    /**
     * An absolute URL of an API path on the host of the connected account.
     * @param {object} context
     * @param {string} path below /api/public/v1, starting with "/"
     * @returns {string}
     */
    apiUrl(context, path) {

        return account(context).origin + API_PREFIX + path;
    },

    // -----------------------------------------------------------------------------------------
    // Sending data
    // -----------------------------------------------------------------------------------------

    /**
     * A JSON input that holds the items of a message: a JSON string, an array mapped from a
     * variable, or one object.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {object[]}
     */
    parseItems(context, value, label) {

        if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
            throw cancelError(context, `${label} is required!`);
        }
        let parsed = value;
        if (typeof value === 'string') {
            try {
                parsed = JSON.parse(value);
            } catch (err) {
                throw cancelError(context, `${label} must be valid JSON.`);
            }
        }
        if (isPlainObject(parsed)) {
            parsed = [parsed];
        }
        if (!Array.isArray(parsed) || parsed.some(item => !isPlainObject(item))) {
            throw cancelError(context, `${label} must be a JSON array of objects.`);
        }
        if (!parsed.length) {
            throw cancelError(context, `${label} must contain at least one item.`);
        }
        return parsed;
    },

    /**
     * The Correlation ID input, or a new UUID.
     * @param {object} context
     * @param {*} value
     * @returns {string}
     */
    correlationId(context, value) {

        if (isEmpty(value)) {
            return crypto.randomUUID();
        }
        const text = String(value).trim();
        // eslint-disable-next-line no-control-regex
        if (text.length > MAX_CORRELATION_ID_LENGTH || /[\u0000-\u001f\u007f]/.test(text)) {
            throw cancelError(context, `Correlation ID must be at most ${MAX_CORRELATION_ID_LENGTH} characters, `
                + 'without line breaks.');
        }
        return text;
    },

    /**
     * The request body of one operation: the items checked against the documented schema, with
     * the fields an item leaves out filled in — the client code and property code of the connected
     * account, the Correlation ID of the message and, for inventory, the creation time.
     * @param {object} context
     * @param {string} kind reservations | groups | inventories
     * @param {object[]} items
     * @param {string} correlationId
     * @returns {object[]}
     */
    buildItems(context, kind, items, correlationId) {

        const { label, max } = KINDS[kind];
        const acc = account(context);
        if (max && items.length > max) {
            throw cancelError(context, `IDeaS accepts at most ${max} items in one ${label} message, got `
                + `${items.length}. Split them into several messages.`);
        }
        const now = new Date().toISOString();
        return items.map((item, index) => {
            const filled = { ...item };
            if (isEmpty(filled.clientCode) && acc.clientCode) {
                filled.clientCode = acc.clientCode;
            }
            if (isEmpty(filled.propertyCode) && acc.propertyCode) {
                filled.propertyCode = acc.propertyCode;
            }
            if (isEmpty(filled.correlationId)) {
                filled.correlationId = correlationId;
            }
            if (kind === 'inventories' && isEmpty(filled.createDateTime)) {
                filled.createDateTime = now;
            }
            return normalizeObject(filled, SCHEMAS[kind], '', (path, problem) => {
                throw cancelError(context, `${label}: item ${index + 1}: ${path} ${problem}`);
            });
        });
    },

    /**
     * The tracker ID of an acknowledgement. The operation pages document the body as the "UUID of
     * request", a plain string. Any other body (the request guide shows a JSON object, the schema
     * validation service answers {"status":"success"}) has none.
     * @param {*} data
     * @returns {string}
     */
    trackerIdOf(data) {

        if (typeof data !== 'string') {
            return '';
        }
        const text = data.trim().replace(/^"(.*)"$/, '$1');
        return /^[A-Za-z0-9._:-]{1,200}$/.test(text) ? text : '';
    },

    /**
     * Send the items of one message and return what the "out" port sends on.
     * @param {object} context
     * @param {string} kind reservations | groups | inventories
     * @returns {Promise<{ trackerId: string, statusCode: number, correlationId: string, count: number,
     *   responseBody: string }>}
     */
    async submit(context, kind) {

        const { label, path } = KINDS[kind];
        const content = context.messages.in.content || {};
        const items = lib.parseItems(context, content[kind], label);
        const correlationId = lib.correlationId(context, content.correlationId);
        const data = lib.buildItems(context, kind, items, correlationId);

        const response = await lib.request(context, {
            method: 'POST',
            url: lib.apiUrl(context, path),
            headers: {
                'Content-Type': 'application/json',
                ReplyTo: lib.buildReplyUrl(context, { kind, count: data.length, correlationId })
            },
            data
        });

        const body = response && response.data;
        let responseBody = '';
        if (typeof body === 'string') {
            responseBody = body;
        } else if (body !== undefined && body !== null) {
            responseBody = JSON.stringify(body);
        }
        return {
            trackerId: lib.trackerIdOf(body),
            statusCode: response.status,
            correlationId,
            count: data.length,
            responseBody: responseBody.slice(0, MAX_REPLY_TEXT_LENGTH)
        };
    },

    // -----------------------------------------------------------------------------------------
    // The reply (processing result)
    // -----------------------------------------------------------------------------------------

    /**
     * Sign a reply token. It is the only thing that authenticates a reply: IDeaS documents no
     * signature or credential on its callback, so the URL handed over in "ReplyTo" is made
     * unguessable and bound to what it is for. The key is derived from the client secret of the
     * connected account and never leaves the component; the token covers the flow, the component,
     * the message that sent the data (the engine's correlation and message ID) and the time.
     * @param {object} acc the result of account()
     * @param {string} flowId
     * @param {string} componentId
     * @param {object} payload
     * @returns {string} "<payload>.<signature>", both base64url
     */
    signReplyToken(acc, flowId, componentId, payload) {

        const body = base64url(JSON.stringify(payload));
        return `${body}.${replyMac(acc, flowId, componentId, body)}`;
    },

    /**
     * Read the payload of a reply token WITHOUT checking its signature. For the plugin route, which
     * has no account and only needs to know which message the reply continues; the component
     * verifies the token before anything is sent on.
     * @param {string} token
     * @returns {object|null}
     */
    decodeReplyToken(token) {

        if (typeof token !== 'string' || token.length > MAX_REPLY_TOKEN_LENGTH) {
            return null;
        }
        const parts = token.split('.');
        if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) {
            return null;
        }
        try {
            const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
            return isPlainObject(payload) ? payload : null;
        } catch (err) {
            return null;
        }
    },

    /**
     * Verify a reply token with the connected account of the component that received it.
     * @param {object} acc the result of account()
     * @param {string} flowId
     * @param {string} componentId
     * @param {string} token
     * @param {number} [now]
     * @returns {object} the payload
     * @throws {ReplyTokenError}
     */
    verifyReplyToken(acc, flowId, componentId, token, now = Date.now()) {

        const payload = lib.decodeReplyToken(token);
        if (!payload) {
            throw new ReplyTokenError('malformed');
        }
        if (!acc.clientSecret) {
            throw new ReplyTokenError('no_secret');
        }
        const [body, mac] = token.split('.');
        const expected = Buffer.from(replyMac(acc, flowId, componentId, body));
        const given = Buffer.from(mac);
        if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
            throw new ReplyTokenError('signature');
        }
        if (payload.v !== REPLY_TOKEN_VERSION) {
            throw new ReplyTokenError('version');
        }
        if (!Number.isFinite(payload.t) || payload.t > now + 5 * 60 * 1000 || now - payload.t > REPLY_VALIDITY_MS) {
            throw new ReplyTokenError('expired');
        }
        return payload;
    },

    /**
     * The URL IDeaS posts the processing result to: a route of this connector's plugin
     * (routes.js), not the component's own webhook URL. The Tracker API documents the callback as
     * "/trackers/{trackerId}", and whether IDeaS calls the ReplyTo URL as it is or appends that
     * path is not documented. A URL without a query that already ends with "/trackers/<token>"
     * works either way; the engine's webhook URL (with its query) would not.
     * @param {object} context
     * @param {{ kind: string, count: number, correlationId: string }} echo
     * @returns {string}
     */
    buildReplyUrl(context, { kind, count, correlationId }) {

        // inPortName: the query then names the message on "in" whose scope the reply continues.
        const webhook = new URL(context.getWebhookUrl({ inPortName: 'in' }));
        const index = webhook.pathname.lastIndexOf('/flows/');
        let apiBase;
        if (index !== -1) {
            apiBase = webhook.origin + webhook.pathname.slice(0, index);
        } else if (context.appmixerApiUrl) {
            apiBase = String(context.appmixerApiUrl).replace(/\/+$/, '');
        } else {
            throw new Error('The URL of this Appmixer instance could not be determined.');
        }
        const flowId = String(context.flowId || '');
        const componentId = String(context.componentId || '');
        if (!ID_PATTERN.test(flowId) || !ID_PATTERN.test(componentId)) {
            throw new Error('The flow or component ID of this component could not be determined.');
        }
        const token = lib.signReplyToken(account(context), flowId, componentId, {
            v: REPLY_TOKEN_VERSION,
            t: Date.now(),
            // The engine restores the scope of the message that sent the data from these three.
            c: webhook.searchParams.get('correlationId') || '',
            p: webhook.searchParams.get('correlationInPort') || '',
            m: webhook.searchParams.get('messageId') || '',
            k: kind,
            n: count,
            u: correlationId
        });
        return `${apiBase}/plugins/appmixer/ideas/reply/${flowId}/${componentId}/trackers/${token}`;
    },

    /**
     * The messages of a reply as a list of { code, text }. The Tracker API sends "messages", the
     * message flow diagram of the request guide a "description".
     * @param {object} body
     * @returns {Array<{ code: string, text: string }>}
     */
    replyMessages(body) {

        const text = (value) => {
            if (value === undefined || value === null) return '';
            return (typeof value === 'string' ? value : JSON.stringify(value)).slice(0, MAX_REPLY_TEXT_LENGTH);
        };
        const messages = (Array.isArray(body.messages) ? body.messages : [])
            .slice(0, MAX_REPLY_MESSAGES)
            .map(item => (isPlainObject(item)
                ? { code: text(item.code), text: text(item.text) }
                : { code: '', text: text(item) }))
            .filter(item => item.code || item.text);
        if (!messages.length && !isEmpty(body.description)) {
            messages.push({ code: '', text: text(body.description) });
        }
        return messages;
    },

    /**
     * The webhook branch of the three Send components: a processing result that arrived on the
     * plugin route, sent on to "done" with its status. Nothing is sent on unless the reply token is valid for THIS component and
     * account; the component's own webhook URL needs no credentials, so the check lives here and
     * not only in the route. The answers follow the Tracker API: 200, 400 "Invalid input",
     * 404 "Tracker not found".
     * @param {object} context
     * @param {string} kind reservations | groups | inventories
     * @returns {Promise<*>}
     */
    async receiveReply(context, kind) {

        const content = context.messages.webhook.content || {};
        const reply = isPlainObject(content.data) && isPlainObject(content.data.ideasReply)
            ? content.data.ideasReply
            : null;

        const notFound = async (reason) => {
            // The token is never logged.
            await context.log('warn', 'ideas-reply-rejected', { reason });
            return context.response({ message: 'Tracker not found.' }, 404);
        };

        if (!reply) {
            return notFound('not_a_reply');
        }

        let payload;
        try {
            payload = lib.verifyReplyToken(account(context), context.flowId, context.componentId, reply.token);
        } catch (err) {
            return notFound(err instanceof ReplyTokenError ? err.code : 'account');
        }
        if (payload.k !== kind) {
            return notFound('kind');
        }
        // A valid token is good for the message it was made for, not for any other.
        const query = isPlainObject(content.query) ? content.query : {};
        if (String(query.correlationId || '') !== String(payload.c || '')
            || String(query.messageId || '') !== String(payload.m || '')) {
            return notFound('scope');
        }

        const body = reply.body;
        if (!isPlainObject(body) || typeof body.status !== 'string' || !body.status.trim()) {
            await context.log('warn', 'ideas-reply-invalid', { reason: 'no_status' });
            return context.response({ message: 'Invalid input.' }, 400);
        }

        const status = body.status.trim().toUpperCase().slice(0, 100);
        const messages = lib.replyMessages(body);
        const result = {
            status,
            trackerId: typeof reply.trackerId === 'string' ? reply.trackerId.slice(0, 200) : '',
            correlationId: typeof payload.u === 'string' ? payload.u : '',
            count: Number.isInteger(payload.n) ? payload.n : 0,
            messages,
            message: messages.map(item => item.text).filter(Boolean).join('; ').slice(0, MAX_REPLY_TEXT_LENGTH)
        };
        if (status !== 'SUCCESS' && status !== 'FAILED') {
            // Not a status of the Tracker API. It is passed on as it is rather than dropped.
            await context.log('warn', 'ideas-reply-unknown-status', { status });
        }

        try {
            // One port for both outcomes: a FAILED result is data IDeaS refused, and it must reach
            // the flow as visibly as a success does.
            await context.sendJson(result, 'done');
        } finally {
            // Acknowledge even if the emit threw: without a 2xx IDeaS may deliver again.
            await context.response({}, 200);
        }
    },

    // -----------------------------------------------------------------------------------------
    // Make API Call
    // -----------------------------------------------------------------------------------------

    /**
     * Resolve the endpoint of a Make API Call (a path, or a full URL) against the API host of the
     * connected account and refuse anything that would send the access token somewhere else.
     * Resolving through the WHATWG URL parser and comparing the origin also rejects
     * protocol-relative input such as "//example.com/x".
     * @param {object} context
     * @param {string} url
     * @returns {string} absolute URL on the API host
     */
    resolveApiUrl(context, url) {

        const { origin } = account(context);
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
     * @returns {*}
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
     * ignores case, so "authorization" cannot shadow "Authorization".
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
    }
};

module.exports = lib;
