'use strict';

const crypto = require('crypto');
const common = require('../lib');

// Revinate Porter API (https://porter.revinate.com/documentation): reviews, survey answers, review
// analytics and sentiment of the hotels a Revinate user can access. Read-only, GET only.
const API_BASE_URL = 'https://porter.revinate.com';

// The four headers of a signed request (https://porter.revinate.com/documentation#intro-auth).
const HEADER_USERNAME = 'X-Revinate-Porter-Username';
const HEADER_TIMESTAMP = 'X-Revinate-Porter-Timestamp';
const HEADER_KEY = 'X-Revinate-Porter-Key';
const HEADER_ENCODED = 'X-Revinate-Porter-Encoded';
const AUTH_HEADERS = [HEADER_USERNAME, HEADER_TIMESTAMP, HEADER_KEY, HEADER_ENCODED];

// "Max size is 1000" (documentation, Pagination). Hotels, review sites and languages are small, so
// one request reads the maximum. A review can carry a whole survey with the guest's stay, so a
// page of reviews stays at 100 to keep one flow message well below the engine's size limit.
const MAX_PAGE_SIZE = 1000;
const REVIEW_PAGE_SIZE = 100;

// A trigger check reads at most 10 pages of 100 reviews.
const TRIGGER_MAX_PAGES = 10;

// The timestamp of a request must be within 5 minutes of Revinate's clock. Past this difference
// between the two clocks the request is repeated once with Revinate's time.
const CLOCK_SKEW_TOLERANCE_SECONDS = 120;

// Statuses a retry cannot fix.
const CANCEL_STATUSES = [400, 401, 403, 404];

const STATUS_HINTS = {
    400: 'Revinate rejected the request as invalid.',
    401: 'Revinate did not accept the credentials. Check the username, the API key and the API secret of '
        + 'the connected account; the username must be a Revinate user with access to this API key.',
    403: 'Revinate denied access. The user of the connected account has no access to this hotel or '
        + 'record, or the API key is not enabled for this request.',
    404: 'Revinate did not find this hotel or record.',
    429: 'Revinate rate limit reached.'
};

// Seconds to add to this machine's clock to get Revinate's. Learned from a rejected request, see
// request(). It describes the clock of this process, not an account, so it is shared.
let clockOffsetSeconds = 0;

/**
 * The credentials of the connected account. Components read them from context.auth, the auth.js
 * callbacks from the context itself (the auth context has no "auth").
 * @param {object} context
 * @returns {{ username: string, apiKey: string, apiSecret: string }}
 */
const credentials = (context) => {

    const source = context.auth && context.auth.apiKey ? context.auth : context;
    return {
        username: String(source.username || '').trim(),
        apiKey: String(source.apiKey || '').trim(),
        apiSecret: String(source.apiSecret || '').trim()
    };
};

/**
 * HMAC_SHA256(apiSecret, username + timestamp) as lowercase hex. The key is the API secret as a
 * UTF-8 string: it looks like hex, but it must not be hex-decoded.
 * @param {string} username
 * @param {string} apiSecret
 * @param {number|string} timestamp epoch seconds
 * @returns {string} 64 hex characters
 */
const sign = (username, apiSecret, timestamp) => {

    return crypto.createHmac('sha256', apiSecret).update(username + String(timestamp)).digest('hex');
};

/**
 * The one place that turns a connected account into request headers. The signature covers the
 * timestamp, so the headers are computed for every request and never cached.
 * @param {object} context
 * @param {number} [timestamp] epoch seconds; defaults to now, corrected by the known clock offset
 * @returns {object}
 */
const authHeaders = (context, timestamp) => {

    const { username, apiKey, apiSecret } = credentials(context);
    const seconds = timestamp === undefined ? Math.floor(Date.now() / 1000) + clockOffsetSeconds : timestamp;
    return {
        [HEADER_USERNAME]: username,
        [HEADER_TIMESTAMP]: String(seconds),
        [HEADER_KEY]: apiKey,
        [HEADER_ENCODED]: sign(username, apiSecret, seconds)
    };
};

/**
 * Revinate's time in epoch seconds, read from an error answer. Porter puts its clock into every
 * error body ({ "timestamp": 1795716348962, "status": 401, ... }); the Date header is the fallback.
 * @param {object} response
 * @returns {number|undefined}
 */
const serverSeconds = (response) => {

    const body = response && response.data;
    if (body && Number.isFinite(body.timestamp) && body.timestamp > 0) {
        return Math.floor(body.timestamp / 1000);
    }
    const header = response && response.headers && (response.headers.date || response.headers.Date);
    const parsed = header ? Date.parse(header) : NaN;
    return Number.isNaN(parsed) ? undefined : Math.floor(parsed / 1000);
};

/**
 * Turn an HTTP error into an error with Revinate's own message. Porter answers errors as
 * { timestamp, status, error, message, path }. Errors a retry cannot fix become CancelError.
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
        detail = body.message || body.error || '';
    } else if (typeof body === 'string') {
        detail = body.slice(0, 300);
    }
    const hint = STATUS_HINTS[status] || 'Revinate API request failed.';
    const message = `${hint} (HTTP ${status}${detail ? ': ' + detail : ''})`;
    const error = CANCEL_STATUSES.includes(status) ? common.cancelError(context, message) : new Error(message);
    error.response = { status, data: response.data };
    return error;
};

/**
 * The numeric ID at the end of a link of the given relation. Porter representations carry no "id"
 * field: the ID of a hotel, a review, a review site or a language is only in its "self" link
 * (https://porter.revinate.com/reviews/123), and the hotel of a review in its "hotel" link.
 * @param {Array} links [{ rel, href }]
 * @param {string} rel
 * @returns {number|undefined} undefined when there is no such link or it does not end with digits
 */
const idFromLinks = (links, rel) => {

    const link = Array.isArray(links) ? links.find(item => item && item.rel === rel && item.href) : undefined;
    if (!link) {
        return undefined;
    }
    // Without a query or fragment, and without the {?page,size} suffix of a templated link.
    const path = String(link.href).split(/[?#{]/)[0].replace(/\/+$/, '');
    const match = path.match(/\/(\d{1,19})$/);
    return match ? Number(match[1]) : undefined;
};

/**
 * A representation with its ID taken from the "self" link.
 * @param {object} item
 * @returns {object}
 */
const withId = (item) => {

    const source = item && typeof item === 'object' ? item : {};
    const id = idFromLinks(source.links, 'self');
    return id === undefined ? { ...source } : { id, ...source };
};

const lib = {

    ...common,

    API_BASE_URL,
    AUTH_HEADERS,
    MAX_PAGE_SIZE,
    REVIEW_PAGE_SIZE,
    TRIGGER_MAX_PAGES,

    sign,
    authHeaders,
    idFromLinks,
    toApiError,

    /**
     * Forget the learned clock offset (tests).
     */
    resetClock() {

        clockOffsetSeconds = 0;
    },

    /**
     * GET a resource of the Porter API with the connected account. The URL is always built from the
     * fixed API origin, so the credentials cannot be sent anywhere else.
     *
     * A 401 is repeated once with Revinate's own time when the two clocks differ by more than
     * CLOCK_SKEW_TOLERANCE_SECONDS: Revinate rejects a timestamp that is more than 5 minutes off,
     * and a wrong clock on this side would otherwise fail every request.
     * @param {object} context
     * @param {object} options { path, params } path starts with "/" and is already encoded
     * @returns {Promise<*>} the response body
     */
    async request(context, { path, params }) {

        const url = API_BASE_URL + path + common.toQueryString(params);

        for (let attempt = 0; ; attempt++) {
            const sentAt = Math.floor(Date.now() / 1000);
            try {
                const response = await context.httpRequest({ method: 'GET', url, headers: authHeaders(context) });
                return response.data;
            } catch (err) {
                const status = err && err.response && err.response.status;
                const theirs = status === 401 ? serverSeconds(err.response) : undefined;
                if (attempt === 0 && theirs !== undefined
                    && Math.abs(theirs - sentAt - clockOffsetSeconds) > CLOCK_SKEW_TOLERANCE_SECONDS) {
                    clockOffsetSeconds = theirs - sentAt;
                    continue;
                }
                throw toApiError(context, err);
            }
        }
    },

    /**
     * GET a single resource (a hotel, a review, a snapshot) and make sure the answer is an object,
     * so that a component never sends an empty message.
     * @param {object} context
     * @param {object} options { path, params, label }
     * @returns {Promise<object>}
     */
    async fetchObject(context, { path, params, label }) {

        const data = await lib.request(context, { path, params });
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error(`Revinate returned an unexpected answer for ${label}.`);
        }
        return data;
    },

    /**
     * One page of a paged Porter resource. The answer is { content: [...], page: { size,
     * totalElements, totalPages, number }, links }. Pages are numbered from 0.
     * @param {object} context
     * @param {object} options { path, params, size, page, label }
     * @returns {Promise<{ records: Array, totalPages: number, totalElements: number }>}
     */
    async fetchPage(context, { path, params = {}, size, page = 0, label }) {

        const data = await lib.request(context, { path, params: { ...params, page, size } });
        if (!data || !Array.isArray(data.content)) {
            throw new Error(`Revinate returned an unexpected answer for ${label}.`);
        }
        const meta = data.page || {};
        return {
            records: data.content,
            totalPages: Number.isFinite(meta.totalPages) ? meta.totalPages : 1,
            totalElements: Number.isFinite(meta.totalElements) ? meta.totalElements : data.content.length
        };
    },

    /**
     * A hotel as the components return it: the representation plus its "id".
     * @param {object} hotel
     * @returns {object}
     */
    mapHotel(hotel) {

        return withId(hotel);
    },

    /**
     * A review as the components return it: the representation plus "id" (from the "self" link) and
     * "hotelId" (from the "hotel" link), and the IDs of its review site and language.
     * @param {object} review
     * @returns {object}
     */
    mapReview(review) {

        const mapped = withId(review);
        const hotelId = idFromLinks(mapped.links, 'hotel');
        if (hotelId !== undefined) {
            mapped.hotelId = hotelId;
        }
        if (mapped.reviewSite && typeof mapped.reviewSite === 'object') {
            mapped.reviewSite = withId(mapped.reviewSite);
        }
        if (mapped.language && typeof mapped.language === 'object') {
            mapped.language = withId(mapped.language);
        }
        return mapped;
    },

    /**
     * What identifies a review for a trigger. Normally its ID. A review without a usable "self"
     * link still has to fire exactly once, so it is identified by a hash of the fields that do not
     * change when Revinate collects it again.
     * @param {object} review a mapped review
     * @returns {string}
     */
    reviewKey(review) {

        if (review.id !== undefined && review.id !== null) {
            return String(review.id);
        }
        const fingerprint = JSON.stringify([
            review.crawledUrl, review.dateReview, review.dateCollected, review.author, review.title,
            review.reviewSite && review.reviewSite.slug, review.hotelId
        ]);
        return 'h:' + crypto.createHash('sha256').update(fingerprint).digest('hex');
    },

    /**
     * A date range as the API expects it: "{start}..{end}" in epoch seconds. An open start is 0, an
     * open end is now. Without any bound there is no filter.
     * @param {object} context
     * @param {*} fromValue
     * @param {*} toValue
     * @param {string} label "Collected" → "Collected From" / "Collected To" in error messages
     * @returns {string|undefined}
     */
    toDateRange(context, fromValue, toValue, label) {

        const from = common.toDate(context, fromValue, `${label} From`);
        const to = common.toDate(context, toValue, `${label} To`);
        if (!from && !to) {
            return undefined;
        }
        const start = from ? Math.floor(from.getTime() / 1000) : 0;
        const end = to ? Math.floor(to.getTime() / 1000) : Math.floor(Date.now() / 1000);
        if (start > end) {
            throw common.cancelError(context, `${label} To must not be earlier than ${label} From.`);
        }
        return `${start}..${end}`;
    },

    /**
     * The query filters shared by the review endpoints, from component inputs or trigger properties.
     * @param {object} context
     * @param {object} input { ratings, feedback, response, languageSlug, reviewSiteSlug }
     * @returns {object}
     */
    reviewFilters(context, input = {}) {

        let ratings;
        if (!common.isEmpty(input.ratings) && !(Array.isArray(input.ratings) && !input.ratings.length)) {
            const values = common.normalizeMultiselectInput(input.ratings, context, 'Ratings').map(value => String(value));
            const invalid = values.find(value => !/^[1-5]$/.test(value));
            if (invalid !== undefined) {
                throw common.cancelError(context, `Ratings must be numbers from 1 to 5, got "${invalid}".`);
            }
            ratings = values.join(',');
        }
        return common.clean({
            ratings,
            feedback: input.feedback,
            response: input.response,
            languageSlug: common.isEmpty(input.languageSlug) ? undefined : String(input.languageSlug).trim(),
            reviewSiteSlug: common.isEmpty(input.reviewSiteSlug) ? undefined : String(input.reviewSiteSlug).trim()
        });
    },

    /**
     * The path of the review stream: all hotels of the account, or one hotel.
     * @param {object} context
     * @param {*} hotelId optional
     * @returns {string}
     */
    reviewsPath(context, hotelId) {

        return common.isEmpty(hotelId)
            ? '/reviews'
            : `/hotels/${common.requireNumericId(context, hotelId, 'Hotel')}/reviews`;
    },

    /**
     * The hotels the connected account can access, for the Hotel dropdowns. Cached, because the
     * designer asks for them in bursts.
     * @param {object} context
     * @returns {Promise<Array<{ id: number, name: string }>>}
     */
    listHotelsCached(context) {

        const { username, apiKey } = credentials(context);
        return common.callCached(context, { source: 'reputation-hotels', username, apiKey }, async () => {
            const { records } = await lib.fetchPage(context, {
                path: '/hotels', size: MAX_PAGE_SIZE, label: 'the list of hotels'
            });
            return records.map(lib.mapHotel)
                .filter(hotel => hotel.id !== undefined)
                .map(hotel => ({ id: hotel.id, name: hotel.name }));
        });
    },

    /**
     * A slug-keyed lookup list (review sites, languages), for dropdowns. Cached.
     * @param {object} context
     * @param {object} options { path, source, label }
     * @returns {Promise<Array>}
     */
    listLookupCached(context, { path, source, label }) {

        const { username, apiKey } = credentials(context);
        return common.callCached(context, { source, username, apiKey }, async () => {
            const { records } = await lib.fetchPage(context, { path, size: MAX_PAGE_SIZE, label });
            return records.map(withId);
        });
    },

    /**
     * The polling body of the review triggers: reviews whose timeField (dateCollected or updatedAt)
     * falls into the window since the previous check, oldest first.
     * @param {object} context
     * @param {object} options { timeField, getKey, properties }
     * @returns {Promise<{ emit: Array, state: (object|null), truncated: boolean }>}
     */
    pollReviews(context, { timeField, getKey, properties = {} }) {

        const path = lib.reviewsPath(context, properties.hotelId);
        const filters = lib.reviewFilters(context, properties);
        const intervalMinutes = common.boundedInteger(context, properties.pollingInterval, {
            label: 'Check Every (Minutes)', min: 1, max: 1440, fallback: 15
        });

        return common.pollWindow(context, {
            intervalMs: intervalMinutes * 60 * 1000,
            maxPages: TRIGGER_MAX_PAGES,
            getTime: review => Number(review[timeField]) * 1000,
            getKey,
            fetchPage: async (fromMs, toMs, page) => {
                const { records, totalPages } = await lib.fetchPage(context, {
                    path,
                    params: {
                        ...filters,
                        [timeField]: `${Math.floor(fromMs / 1000)}..${Math.ceil(toMs / 1000)}`,
                        sort: `${timeField},ASC`
                    },
                    size: REVIEW_PAGE_SIZE,
                    page,
                    label: 'the list of reviews'
                });
                return { records: records.map(lib.mapReview), totalPages };
            }
        });
    },

    /**
     * The most recent review that matches a trigger's settings, for Flow Test Mode.
     * @param {object} context
     * @param {object} options { timeField, properties }
     * @returns {Promise<object|undefined>}
     */
    async fetchLatestReview(context, { timeField, properties = {} }) {

        const { records } = await lib.fetchPage(context, {
            path: lib.reviewsPath(context, properties.hotelId),
            params: { ...lib.reviewFilters(context, properties), sort: `${timeField},DESC` },
            size: 1,
            label: 'the list of reviews'
        });
        return records.length ? lib.mapReview(records[0]) : undefined;
    }
};

module.exports = lib;
