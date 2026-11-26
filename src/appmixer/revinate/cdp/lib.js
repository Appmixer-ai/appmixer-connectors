'use strict';

const crypto = require('crypto');
const common = require('../lib');

// Revinate CDP API v2 (https://developer.revinate.com/): Rich Guest Profiles and reservations of
// one Revinate account. Read-only: GET only, apart from the token request.
const API_BASE_URL = 'https://api.revinate.com';
const TOKEN_PATH = '/oauth/token';
const TOKEN_AUDIENCE = 'CDP_API';

// Headers set from the connected account.
const HEADER_ACCOUNT = 'X-Account-Id';
const AUTH_HEADERS = ['Authorization', HEADER_ACCOUNT];

// The documentation shows a page of 10 and names no maximum for pageLimit. 100 is this connector's
// choice and is NOT confirmed against a live account.
const PAGE_LIMIT = 100;

// A trigger check reads at most 20 pages of 100 records.
const TRIGGER_MAX_PAGES = 20;

// A token lives for a day (expires_in 86400 in the documentation). It is reused until 5 minutes
// before it expires, so that an account asks for about one token a day.
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const TOKEN_FALLBACK_LIFETIME_S = 3600;

// The API answers 403 both for an expired or revoked token and for an Account ID the credentials
// are not allowed to use. A cached token is therefore replaced once on 403, but only when it is
// older than this, so that a wrong Account ID cannot make every message request a new token.
const TOKEN_MIN_AGE_BEFORE_REFRESH_MS = 60 * 60 * 1000;

// Statuses a retry cannot fix.
const CANCEL_STATUSES = [400, 401, 403, 404];

const STATUS_HINTS = {
    400: 'Revinate rejected the request as invalid.',
    401: 'Revinate did not accept the access token.',
    403: 'Revinate denied access. The client credentials of the connected account are not authorized '
        + 'for this Account ID, or the access token is no longer valid.',
    404: 'Revinate did not find this record.',
    429: 'Revinate rejected the request because the agreed API quota is used up.'
};

// The reservation lists of the answer of GET /api/v2/reservations, with the field that holds the
// ID of a reservation of that type and the list of its parts (a restaurant reservation has none).
const RESERVATION_TYPES = [
    { key: 'room_reservations', type: 'room', idField: 'revinate_room_reservation_id', parts: 'room_stays' },
    { key: 'spa_reservations', type: 'spa', idField: 'revinate_spa_reservation_id', parts: 'spa_treatments' },
    { key: 'restaurant_reservations', type: 'restaurant', idField: 'revinate_restaurant_reservation_id' },
    { key: 'golf_reservations', type: 'golf', idField: 'revinate_golf_reservation_id', parts: 'tee_times' }
];

/**
 * The credentials of the connected account. Components read them from context.auth, the auth.js
 * callbacks from the context itself (the auth context has no "auth").
 * @param {object} context
 * @returns {{ clientId: string, clientSecret: string, accountId: string }}
 */
const credentials = (context) => {

    const source = context.auth && context.auth.clientId ? context.auth : context;
    return {
        clientId: String(source.clientId || '').trim(),
        clientSecret: String(source.clientSecret || '').trim(),
        accountId: String(source.accountId || '').trim()
    };
};

/**
 * Turn an HTTP error into an error with Revinate's own message. The API gateway answers errors as
 * { message } or { Message }, the token endpoint as { error, error_description }. Errors a retry
 * cannot fix become CancelError.
 * @param {object} context
 * @param {Error} err
 * @param {object} [hints] status → text, replacing the default hint
 * @returns {Error}
 */
const toApiError = (context, err, hints = {}) => {

    const response = err && err.response;
    // No HTTP answer, or already converted (a refused token request passes through request()).
    if (!response || err.revinateApiError) {
        return err;
    }
    const status = response.status;
    const body = response.data;
    let detail = '';
    if (body && typeof body === 'object') {
        detail = body.error_description || body.message || body.Message || body.error || '';
    } else if (typeof body === 'string') {
        detail = body.slice(0, 300);
    }
    const hint = hints[status] || STATUS_HINTS[status] || 'Revinate API request failed.';
    const message = `${hint} (HTTP ${status}${detail ? ': ' + detail : ''})`;
    const error = CANCEL_STATUSES.includes(status) ? common.cancelError(context, message) : new Error(message);
    error.response = { status, data: response.data };
    error.revinateApiError = true;
    return error;
};

const tokenCacheKey = ({ clientId, clientSecret }) => {

    return 'revinate-cdp-token-' + crypto.createHash('sha256').update(clientId + '\n' + clientSecret).digest('hex');
};

const lib = {

    ...common,

    API_BASE_URL,
    AUTH_HEADERS,
    PAGE_LIMIT,
    TRIGGER_MAX_PAGES,
    RESERVATION_TYPES,

    toApiError,

    /**
     * Request a new access token: POST /oauth/token with a JSON body (the endpoint answers 415 to a
     * form body). The URL is fixed, so the client secret cannot be sent anywhere else.
     * @param {object} context
     * @returns {Promise<{ token: string, issuedAt: number, expiresAt: number }>}
     */
    async requestToken(context) {

        const { clientId, clientSecret } = credentials(context);
        let data;
        try {
            ({ data } = await context.httpRequest({
                method: 'POST',
                url: API_BASE_URL + TOKEN_PATH,
                data: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    audience: TOKEN_AUDIENCE,
                    grant_type: 'client_credentials'
                }
            }));
        } catch (err) {
            throw toApiError(context, err, {
                400: 'Revinate rejected the token request.',
                401: 'Revinate did not accept the Client ID and Client Secret of the connected account.',
                403: 'Revinate did not accept the Client ID and Client Secret of the connected account.'
            });
        }
        if (!data || typeof data.access_token !== 'string' || !data.access_token) {
            throw new Error('Revinate returned no access token.');
        }
        // expires_in is documented as a string and shown as a number.
        const expiresIn = Number(data.expires_in);
        const lifetime = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : TOKEN_FALLBACK_LIFETIME_S;
        const issuedAt = Date.now();
        return { token: data.access_token, issuedAt, expiresAt: issuedAt + lifetime * 1000 };
    },

    /**
     * The access token of the connected account. Revinate issues it for a day and has no refresh
     * token, so it is kept in the engine's cache and shared by every component of the account; the
     * lock keeps concurrent messages from each requesting their own. In auth.js there is no cache
     * and a token is requested directly.
     * @param {object} context
     * @param {object} [options] { replace } replace: the token that was just refused, to be replaced
     *   unless another message already did so
     * @returns {Promise<{ token: string, issuedAt: number, expiresAt: number, cached: boolean }>}
     */
    async getAccessToken(context, { replace } = {}) {

        if (!context.staticCache || !context.lock) {
            return { ...(await lib.requestToken(context)), cached: false };
        }

        const key = tokenCacheKey(credentials(context));
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            const usable = cached && cached.token && cached.expiresAt - TOKEN_EXPIRY_MARGIN_MS > Date.now();
            if (usable && cached.token !== replace) {
                return { ...cached, cached: true };
            }
            const fresh = await lib.requestToken(context);
            const ttl = Math.max(60 * 1000, fresh.expiresAt - fresh.issuedAt - TOKEN_EXPIRY_MARGIN_MS);
            await context.staticCache.set(key, fresh, ttl);
            return { ...fresh, cached: false };
        } finally {
            lock && await lock.unlock();
        }
    },

    /**
     * The Account ID of a request: the component's own input, or the one of the connected account.
     * It becomes a header, so only letters, digits, "-" and "_" are accepted.
     * @param {object} context
     * @param {*} [override] the Account ID input of a component
     * @returns {string}
     */
    accountId(context, override) {

        const value = common.isEmpty(override) ? credentials(context).accountId : String(override).trim();
        if (!value) {
            throw common.cancelError(context, 'Account ID is required!');
        }
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
            throw common.cancelError(context, `Account ID must contain only letters, digits, "-" and "_", got "${value}".`);
        }
        return value;
    },

    /**
     * The headers of an API request for a token.
     * @param {object} context
     * @param {string} token
     * @param {*} [accountId] the Account ID input of a component
     * @returns {object}
     */
    authHeaders(context, token, accountId) {

        return {
            Authorization: 'Bearer ' + token,
            [HEADER_ACCOUNT]: lib.accountId(context, accountId)
        };
    },

    /**
     * Send a request with the connected account's token. A cached token that Revinate refuses is
     * replaced once (see TOKEN_MIN_AGE_BEFORE_REFRESH_MS) and the request repeated.
     * @param {object} context
     * @param {object} options { accountId }
     * @param {Function} send async (headers) => response; the caller builds the request
     * @returns {Promise<object>} the response
     */
    async withToken(context, { accountId } = {}, send) {

        // Checked before a token is requested: a missing Account ID needs no request at all.
        lib.accountId(context, accountId);

        let token = await lib.getAccessToken(context);
        try {
            return await send(lib.authHeaders(context, token.token, accountId));
        } catch (err) {
            const status = err && err.response && err.response.status;
            const refused = status === 401 || status === 403;
            if (!refused || !token.cached || Date.now() - token.issuedAt < TOKEN_MIN_AGE_BEFORE_REFRESH_MS) {
                throw err;
            }
            token = await lib.getAccessToken(context, { replace: token.token });
            return send(lib.authHeaders(context, token.token, accountId));
        }
    },

    /**
     * GET a resource of the CDP API with the connected account. The URL is always built from the
     * fixed API origin, so the token cannot be sent anywhere else.
     * @param {object} context
     * @param {object} options { path, params, accountId, headers } path starts with "/" and is
     *   already encoded
     * @returns {Promise<*>} the response body
     */
    async request(context, { path, params, accountId, headers = {} }) {

        const url = API_BASE_URL + path + common.toQueryString(params);
        try {
            const response = await lib.withToken(context, { accountId }, (authHeaders) => {
                return context.httpRequest({ method: 'GET', url, headers: { ...headers, ...authHeaders } });
            });
            return response.data;
        } catch (err) {
            throw toApiError(context, err);
        }
    },

    /**
     * The ID of a Rich Guest Profile for a URL path. Anything that could change the path of the
     * request is refused.
     * @param {object} context
     * @param {*} value
     * @returns {string}
     */
    requireProfileId(context, value) {

        const id = common.isEmpty(value) ? '' : String(value).trim();
        if (!id) {
            throw common.cancelError(context, 'Profile ID is required!');
        }
        if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
            throw common.cancelError(context, `Profile ID must contain only letters, digits, "-" and "_", got "${id}".`);
        }
        return id;
    },

    /**
     * A date-time input as the API's filters take it: ISO 8601 in UTC with milliseconds, the format
     * of the timestamps the API returns.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {string|undefined}
     */
    toApiDate(context, value, label) {

        const date = common.toDate(context, value, label);
        return date ? date.toISOString() : undefined;
    },

    /**
     * The lastModifiedAtFrom / lastModifiedAtTo filters from two inputs.
     * @param {object} context
     * @param {*} fromValue
     * @param {*} toValue
     * @returns {object}
     */
    modifiedRange(context, fromValue, toValue) {

        const from = lib.toApiDate(context, fromValue, 'Modified From');
        const to = lib.toApiDate(context, toValue, 'Modified To');
        if (from && to && from > to) {
            throw common.cancelError(context, 'Modified To must not be earlier than Modified From.');
        }
        return common.clean({ lastModifiedAtFrom: from, lastModifiedAtTo: to });
    },

    /**
     * One page of a paged CDP resource. The answer is { meta: { page: { number, limit,
     * total_records, total_pages } }, data }.
     * @param {object} context
     * @param {object} options { path, params, accountId, pageNumber, pageLimit, label }
     *   pageNumber undefined asks for the first page, whatever number the API gives it
     * @returns {Promise<{ data: *, number: (number|undefined), totalPages: number }>}
     */
    async fetchPage(context, { path, params = {}, accountId, pageNumber, pageLimit = PAGE_LIMIT, label }) {

        const body = await lib.request(context, { path, accountId, params: { ...params, pageNumber, pageLimit } });
        if (!body || typeof body !== 'object' || body.data === undefined || body.data === null) {
            throw new Error(`Revinate returned an unexpected answer for ${label}.`);
        }
        const page = (body.meta && body.meta.page) || {};
        return {
            data: body.data,
            number: Number.isFinite(page.number) ? page.number : undefined,
            totalPages: Number.isFinite(page.total_pages) ? page.total_pages : 1
        };
    },

    /**
     * A Rich Guest Profile as the components return it: the profile as Revinate sends it plus two
     * plain lists, "emails" and "phones". In the API they sit four levels deep
     * (contact_info.email_addresses[].email_address_reference.email_address_id.email_address),
     * which no flow can address without code.
     * @param {object} profile
     * @returns {object}
     */
    mapProfile(profile) {

        const contact = (profile && profile.contact_info) || {};
        const pick = (list, reference, id, field) => (Array.isArray(list) ? list : [])
            .map(item => item && item[reference] && item[reference][id] && item[reference][id][field])
            .filter(value => !common.isEmpty(value));
        return {
            ...profile,
            emails: pick(contact.email_addresses, 'email_address_reference', 'email_address_id', 'email_address'),
            phones: pick(contact.phone_numbers, 'phone_number_reference', 'phone_number_id', 'phone_number')
        };
    },

    /**
     * The profiles of an answer of GET /api/v2/rich-guest-profiles.
     * @param {*} data
     * @returns {Array}
     */
    profilesOf(data) {

        if (!Array.isArray(data)) {
            throw new Error('Revinate returned an unexpected answer for the list of guest profiles.');
        }
        return data.filter(profile => profile && typeof profile === 'object').map(lib.mapProfile);
    },

    /**
     * Keep the reservations of the chosen types (a multiselect input; empty means all).
     * @param {object} context
     * @param {Array} reservations
     * @param {string|string[]} [types]
     * @returns {Array}
     */
    filterReservationTypes(context, reservations, types) {

        if (common.isEmpty(types) || (Array.isArray(types) && !types.length)) {
            return reservations;
        }
        const wanted = common.normalizeMultiselectInput(types, context, 'Reservation Types');
        const known = RESERVATION_TYPES.map(item => item.type);
        const unknown = wanted.find(type => !known.includes(type));
        if (unknown !== undefined) {
            throw common.cancelError(context, `Reservation Types contains an unknown type: "${unknown}".`);
        }
        return reservations.filter(reservation => wanted.includes(reservation.reservation_type));
    },

    /**
     * The reservations of an answer of GET /api/v2/reservations as one flat list. The API groups
     * them by type ({ room_reservations: [...], spa_reservations: [...], ... }) and names the ID
     * differently for each type. Every reservation gets three fields on top of its own:
     * reservation_type, reservation_id and rich_guest_profile_ids (the profiles of the reservation
     * and of its room stays, spa treatments or tee times).
     * @param {*} data
     * @returns {Array}
     */
    reservationsOf(data) {

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('Revinate returned an unexpected answer for the list of reservations.');
        }
        const reservations = [];
        for (const { key, type, idField, parts } of RESERVATION_TYPES) {
            // The documentation's sample nests the restaurant reservations one level deeper.
            const list = Array.isArray(data[key]) ? data[key].flat(Infinity) : [];
            for (const reservation of list) {
                if (!reservation || typeof reservation !== 'object') {
                    continue;
                }
                const children = parts && Array.isArray(reservation[parts]) ? reservation[parts] : [];
                const profileIds = [reservation, ...children]
                    .map(item => item && item.revinate_rich_guest_profile_id)
                    .filter(id => !common.isEmpty(id));
                reservations.push({
                    reservation_type: type,
                    reservation_id: reservation[idField],
                    rich_guest_profile_ids: [...new Set(profileIds)],
                    ...reservation
                });
            }
        }
        return reservations;
    },

    /**
     * The polling body of the CDP triggers: records modified in the window since the previous check.
     * @param {object} context
     * @param {object} options { path, params, extract, getKey, label, properties }
     * @returns {Promise<{ emit: Array, state: (object|null), truncated: boolean }>}
     */
    pollModified(context, { path, params = {}, extract, getKey, label, properties = {} }) {

        const accountId = properties.accountId;
        const intervalMinutes = common.boundedInteger(context, properties.pollingInterval, {
            label: 'Check Every (Minutes)', min: 1, max: 1440, fallback: 15
        });

        // The number the API gives its first page (the documentation's sample shows 1, but does not
        // say so). The first page is requested without a number and tells its own.
        let firstNumber;

        return common.pollWindow(context, {
            intervalMs: intervalMinutes * 60 * 1000,
            maxPages: TRIGGER_MAX_PAGES,
            getTime: record => Date.parse(record.revinate_last_modified_at),
            getKey,
            fetchPage: async (fromMs, toMs, index) => {
                const page = await lib.fetchPage(context, {
                    path,
                    accountId,
                    label,
                    params: {
                        ...params,
                        lastModifiedAtFrom: new Date(fromMs).toISOString(),
                        lastModifiedAtTo: new Date(toMs).toISOString()
                    },
                    pageNumber: index === 0 ? undefined : (firstNumber === undefined ? 1 : firstNumber) + index
                });
                if (index === 0) {
                    firstNumber = page.number;
                }
                return { records: extract(page.data), totalPages: page.totalPages };
            }
        });
    }
};

module.exports = lib;
