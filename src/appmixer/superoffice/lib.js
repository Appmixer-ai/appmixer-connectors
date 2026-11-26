'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const DEFAULT_PREFIX = 'superoffice-objects-export';

// SuperOffice CRM Online has three isolated environments, each with its own SuperID login host,
// client ID and secret: SOD (development), Stage (certification) and Production. The service
// configuration picks one; anything else is refused before a URL is built from it.
const ENVIRONMENTS = ['online', 'sod', 'qaonline'];
const DEFAULT_ENVIRONMENT = 'online';

// The tenant (customer database) identifier, e.g. Cust12345.
const TENANT_PATTERN = /^Cust\d+$/i;

// Claims of the SuperID id_token (namespace http://schemes.superoffice.net/identity/).
const CLAIM_PREFIX = 'http://schemes.superoffice.net/identity/';

// Find components read one page of the archive, polling triggers a smaller one.
const PAGE_SIZE = 500;
const TRIGGER_PAGE_SIZE = 100;

// The tenant API host changes over time ("don't hardcode it"); the state endpoint says how long
// its answer is valid. The cache never keeps it longer than an hour nor shorter than a minute.
const API_BASE_MIN_TTL = 60 * 1000;
const API_BASE_MAX_TTL = 60 * 60 * 1000;

const cancelError = (context, message) => {

    return context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * The SuperOffice environment configured for the service (online, sod or qaonline).
 * @param {object} context
 * @returns {string}
 */
const getEnvironment = (context) => {

    const configured = context.config && context.config.environment;
    const environment = configured ? String(configured).trim().toLowerCase() : DEFAULT_ENVIRONMENT;
    if (!ENVIRONMENTS.includes(environment)) {
        throw new Error('Unsupported SuperOffice environment "' + configured + '". Use one of: ' + ENVIRONMENTS.join(', ') + '.');
    }
    return environment;
};

/**
 * The SuperID host of the environment: login, token and tenant state endpoints live there.
 * @param {object} context
 * @returns {string}
 */
const getLoginOrigin = (context) => {

    return 'https://' + getEnvironment(context) + '.superoffice.com';
};

/**
 * Decode the claims of a JWT (the id_token returned by the token endpoint).
 * The token comes straight from the SuperID token endpoint over TLS, so the claims are read
 * without checking the signature again (OpenID Connect Core 1.0, section 3.1.3.7, item 6).
 * @param {string} token
 * @returns {object}
 */
const decodeJwtClaims = (token) => {

    if (typeof token !== 'string' || token.split('.').length !== 3) {
        return {};
    }
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    } catch (err) {
        return {};
    }
};

/**
 * The tenant identifier (CustNNNNN) from the id_token claims.
 * @param {string} idToken
 * @returns {string|null}
 */
const tenantFromIdToken = (idToken) => {

    const claims = decodeJwtClaims(idToken);
    const ctx = claims[CLAIM_PREFIX + 'ctx'];
    return typeof ctx === 'string' && TENANT_PATTERN.test(ctx) ? ctx : null;
};

/**
 * The tenant identifier of the connected account. Stored at authorization (from the id_token);
 * the access token itself starts with "<version>:<CustNNNNN>." as a fallback.
 * @param {object} context component or auth context
 * @returns {string}
 */
const getTenantId = (context) => {

    const auth = context.auth || {};
    const candidates = [
        auth.tenantId,
        context.tenantId,
        auth.profileInfo && auth.profileInfo.tenantId,
        context.profileInfo && context.profileInfo.tenantId
    ];
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && TENANT_PATTERN.test(candidate)) {
            return candidate;
        }
    }
    const accessToken = auth.accessToken || context.accessToken;
    const match = typeof accessToken === 'string' ? accessToken.match(/^[^:.]+:(Cust\d+)\./i) : null;
    if (match) {
        return match[1];
    }
    throw new Error('The SuperOffice tenant of this account is unknown. Reconnect the account.');
};

/**
 * Check the tenant API URL the state endpoint returned and turn it into the REST v1 base.
 * The access token is sent there, so it must be HTTPS on a superoffice.com host, without
 * credentials or port, and point at the account's own tenant.
 * @param {string} apiUrl e.g. https://online2.superoffice.com/Cust12345/api
 * @param {string} tenantId
 * @returns {string} e.g. https://online2.superoffice.com/Cust12345/api/v1
 */
const toApiBase = (apiUrl, tenantId) => {

    let parsed;
    try {
        parsed = new URL(apiUrl);
    } catch (err) {
        throw new Error('SuperOffice returned an invalid API URL for tenant ' + tenantId + '.');
    }
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, '');
    if (parsed.protocol !== 'https:'
        || parsed.username || parsed.password || parsed.port
        || !/^[a-z0-9-]+\.superoffice\.com$/.test(host)
        || path.toLowerCase() !== '/' + tenantId.toLowerCase() + '/api') {
        throw new Error('SuperOffice returned an unexpected API URL for tenant ' + tenantId + '.');
    }
    return parsed.origin + path + '/v1';
};

const apiBaseCacheKey = (context, tenantId) => 'superoffice-api-base-' + getEnvironment(context) + '-' + tenantId.toLowerCase();

/**
 * Resolve the REST v1 base URL of the account's tenant through the public tenant state endpoint
 * (GET https://{env}.superoffice.com/api/state/{CustNNNNN}), cached until its ValidUntil.
 * @param {object} context
 * @param {object} [options]
 * @param {boolean} [options.refresh] skip the cache (after HTTP 421 Misdirected Request)
 * @returns {Promise<string>}
 */
const getApiBase = async (context, { refresh = false } = {}) => {

    const tenantId = getTenantId(context);
    const cache = context.staticCache;
    const key = apiBaseCacheKey(context, tenantId);

    if (cache && !refresh) {
        const cached = await cache.get(key);
        if (cached) {
            return cached;
        }
    }

    const { data } = await context.httpRequest({
        method: 'GET',
        url: getLoginOrigin(context) + '/api/state/' + encodeURIComponent(tenantId),
        headers: { 'Accept': 'application/json' }
    });

    if (!data || !data.IsRunning || !data.Api) {
        const state = data && data.State ? data.State : 'Unknown';
        const message = 'SuperOffice tenant ' + tenantId + ' is not available (state: ' + state + ').';
        // Maintenance ends by itself; a deleted, suspended or unknown tenant does not.
        if (/maintenance/i.test(state)) {
            throw new Error(message);
        }
        throw cancelError(context, message);
    }

    const base = toApiBase(data.Api, tenantId);
    if (cache) {
        const validUntil = Date.parse(data.ValidUntil);
        const ttl = isNaN(validUntil)
            ? API_BASE_MIN_TTL
            : Math.min(API_BASE_MAX_TTL, Math.max(API_BASE_MIN_TTL, validUntil - Date.now()));
        await cache.set(key, base, ttl);
    }
    return base;
};

/**
 * The one place that turns a connected account into request headers.
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    const accessToken = (context.auth && context.auth.accessToken) || context.accessToken;
    return {
        'Authorization': 'Bearer ' + accessToken,
        'Accept': 'application/json'
    };
};

/**
 * Error detail of a failed WebAPI call: { Error, ErrorType, ErrorMessage, ErrorSource }.
 * @param {Error} err
 * @returns {string}
 */
const errorDetail = (err) => {

    const body = err && err.response && err.response.data;
    if (body && typeof body === 'object') {
        return body.ErrorMessage || body.Message || body.error_description || body.error || err.message;
    }
    return typeof body === 'string' && body ? body : err.message;
};

/**
 * Send a request to the tenant API; a 421 (tenant moved to another host) resolves the base
 * again and retries once.
 * @param {object} context
 * @param {function(string): object} buildOptions gets the API base, returns httpRequest options
 * @returns {Promise<object>} the httpRequest response
 */
const sendWithTenant = async (context, buildOptions) => {

    let base = await getApiBase(context);
    try {
        return await context.httpRequest(buildOptions(base));
    } catch (err) {
        if (err && err.response && err.response.status === 421) {
            base = await getApiBase(context, { refresh: true });
            return context.httpRequest(buildOptions(base));
        }
        throw err;
    }
};

/**
 * Call the SuperOffice REST WebAPI v1 of the account's tenant.
 * Client errors other than 401 (token refresh), 421 and 429 cannot be fixed by retrying,
 * so they become CancelError with SuperOffice's error message.
 * @param {object} context
 * @param {object} options
 * @param {string} [options.method]
 * @param {string} options.path path under /api/v1, e.g. /Contact/123
 * @param {object} [options.params]
 * @param {*} [options.data]
 * @returns {Promise<*>} response body
 */
const rawRequest = async (context, { method = 'GET', path, params, data }) => {

    try {
        const response = await sendWithTenant(context, (base) => {
            const options = { method, url: base + path, headers: authHeaders(context) };
            if (params && Object.keys(params).length) {
                options.params = params;
            }
            if (data !== undefined) {
                options.data = data;
            }
            return options;
        });
        return response.data;
    } catch (err) {
        const status = err && err.response && err.response.status;
        if (status && status >= 400 && status < 500 && ![401, 421, 429].includes(status)) {
            throw cancelError(context, 'SuperOffice API error (' + status + '): ' + errorDetail(err));
        }
        throw err;
    }
};

// Time zone -------------------------------------------------------------------------------
//
// SuperOffice returns and stores date-times as wall-clock values of the tenant (its base time
// zone) without an offset, and ignores an offset in a value it is sent. The components speak
// UTC instead: every date-time they return ends with Z, and a date-time they are given is an
// instant converted to the tenant's wall clock. Nothing depends on the time zone of the server
// Appmixer runs on.

const TIME_ZONE_TTL = 60 * 60 * 1000;
// Zones that share the European daylight saving switch; one of them matches a European offset.
const EUROPEAN_ZONES = ['Europe/London', 'Europe/Oslo', 'Europe/Helsinki'];
const timeZones = new WeakMap();
const formatters = new Map();

/**
 * UTC offset of an IANA zone at an instant, in minutes east of UTC.
 * @param {string} zone
 * @param {number} utcMs
 * @returns {number}
 */
const zoneOffset = (zone, utcMs) => {

    let formatter = formatters.get(zone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: zone,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        formatters.set(zone, formatter);
    }
    const parts = {};
    for (const part of formatter.formatToParts(new Date(utcMs))) {
        parts[part.type] = Number(part.value);
    }
    const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return Math.round((wall - Math.floor(utcMs / 1000) * 1000) / 60000);
};

const offsetAt = (timeZone, utcMs) => (timeZone.zone ? zoneOffset(timeZone.zone, utcMs) : timeZone.bias);

/**
 * The time zone for the UTC offset SuperOffice reports for the tenant right now. SuperOffice gives
 * the current offset only; a European offset is taken as the European zone that has it now, so
 * that dates on the other side of a daylight saving switch are right too. Any other offset is
 * used as it is, all year.
 * @param {number} bias minutes east of UTC
 * @param {number} [now]
 * @returns {{zone?: string, bias?: number}}
 */
const timeZoneForBias = (bias, now = Date.now()) => {

    const zone = EUROPEAN_ZONES.find(name => zoneOffset(name, now) === bias);
    return zone ? { zone } : { bias };
};

/**
 * The time zone of the tenant's date-times: the Time Zone input of the component when set, then
 * the service config key timeZone (both IANA names such as Europe/Oslo), otherwise what
 * SuperOffice reports, cached for an hour.
 * @param {object} context
 * @returns {Promise<{zone?: string, bias?: number}>}
 */
const getTimeZone = async (context) => {

    if (timeZones.has(context)) {
        return timeZones.get(context);
    }
    let timeZone;
    const content = context.messages && context.messages.in && context.messages.in.content;
    const chosen = (content && content.timeZone) || (context.properties && context.properties.timeZone);
    const configured = context.config && context.config.timeZone;
    if (chosen) {
        const zone = String(chosen).trim();
        try {
            zoneOffset(zone, Date.now());
        } catch (err) {
            throw cancelError(context, 'Time Zone "' + chosen + '" is not a time zone name. Use an IANA name such as Europe/Oslo.');
        }
        timeZone = { zone };
    } else if (configured) {
        const zone = String(configured).trim();
        try {
            zoneOffset(zone, Date.now());
        } catch (err) {
            throw new Error('Unsupported SuperOffice time zone "' + configured + '". Use an IANA name such as Europe/Oslo.');
        }
        timeZone = { zone };
    } else {
        const cache = context.staticCache;
        const key = 'superoffice-time-zone-' + getEnvironment(context) + '-' + getTenantId(context).toLowerCase();
        timeZone = cache ? await cache.get(key) : null;
        if (!timeZone) {
            const info = await rawRequest(context, { method: 'POST', path: '/Agents/TimeZone/GetDefaultTimeZoneInformation' });
            const bias = Number(info && info.Bias);
            if (!info || info.Bias === undefined || info.Bias === null || isNaN(bias) || Math.abs(bias) > 14 * 60) {
                throw new Error('SuperOffice did not report the time zone of the tenant.');
            }
            timeZone = timeZoneForBias(bias);
            if (cache) {
                await cache.set(key, timeZone, TIME_ZONE_TTL);
            }
        }
    }
    timeZones.set(context, timeZone);
    return timeZone;
};

/**
 * The time zones the Time Zone input offers: every IANA zone of the runtime and UTC, with the
 * current UTC offset in the label, ordered by offset and name.
 * @returns {Array<{name: string, label: string}>}
 */
const listTimeZones = () => {

    const now = Date.now();
    const names = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : EUROPEAN_ZONES;
    return [...new Set(['UTC', ...names])]
        .map(name => {
            const offset = zoneOffset(name, now);
            const abs = Math.abs(offset);
            const label = '(UTC' + (offset < 0 ? '-' : '+') + String(Math.floor(abs / 60)).padStart(2, '0')
                + ':' + String(abs % 60).padStart(2, '0') + ') ' + name;
            return { name, label, offset };
        })
        .sort((a, b) => a.offset - b.offset || a.name.localeCompare(b.name))
        .map(({ name, label }) => ({ name, label }));
};

// The Time Zone input of the components that read or write a date-time
const TIME_ZONE_INPUT = {
    type: 'text',
    label: 'Time Zone',
    tooltip: 'Optional. The time zone of your SuperOffice tenant, for example Europe/Oslo. SuperOffice keeps date-times in the local time of the tenant; the time zone is detected automatically (reliably for European tenants) and this setting overrides it. Date-times the component returns are always in UTC.',
    source: {
        url: '/component/appmixer/superoffice/core/ListTimeZones?outPort=out',
        data: { transform: './ListTimeZones#toSelectArray' }
    }
};

const request = async (context, options) => {

    await getTimeZone(context);
    return rawRequest(context, options);
};

const pad2 = (value) => String(value).padStart(2, '0');

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;

/**
 * A wall-clock value without an offset ("2026-12-01T12:00:00", "2026-12-01") as if it were UTC.
 * @param {string} value
 * @returns {number|undefined} milliseconds, undefined when the value is not such a string
 */
const wallClockMs = (value) => {

    const match = typeof value === 'string' ? value.trim().match(WALL_CLOCK) : null;
    if (!match) {
        return undefined;
    }
    const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]),
        Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0));
    return isNaN(ms) ? undefined : ms;
};

const formatWallClock = (ms) => {

    const date = new Date(ms);
    return date.getUTCFullYear() + '-' + pad2(date.getUTCMonth() + 1) + '-' + pad2(date.getUTCDate())
        + 'T' + pad2(date.getUTCHours()) + ':' + pad2(date.getUTCMinutes()) + ':' + pad2(date.getUTCSeconds());
};

/**
 * A date-time SuperOffice returned, as UTC: "2026-12-01T13:00:00" on a UTC+1 tenant becomes
 * "2026-12-01T12:00:00Z". A value that already carries an offset is only normalized.
 * @param {{zone?: string, bias?: number}} timeZone
 * @param {*} value
 * @returns {*}
 */
const toUtc = (timeZone, value) => {

    if (typeof value !== 'string' || !value || value.startsWith('0001-')) {
        return value;
    }
    let utc;
    const wall = wallClockMs(value);
    if (wall !== undefined) {
        // The offset belongs to the instant, which is not known yet: two rounds settle it
        utc = wall - offsetAt(timeZone, wall) * 60000;
        utc = wall - offsetAt(timeZone, utc) * 60000;
    } else {
        utc = new Date(value).getTime();
        if (isNaN(utc)) {
            return value;
        }
    }
    return new Date(utc).toISOString().replace('.000Z', 'Z');
};

// The date-time fields of the items the components return
const DATE_FIELDS = ['createdDate', 'updatedDate', 'startDate', 'endDate', 'saleDate', 'deadline', 'closedAt'];

/**
 * The item with its date-times in UTC.
 * @param {object} context
 * @param {object} item
 * @returns {object}
 */
const withUtcDates = (context, item) => {

    const timeZone = context ? timeZones.get(context) : null;
    if (!timeZone || !item) {
        return item;
    }
    for (const field of DATE_FIELDS) {
        if (item[field] !== undefined) {
            item[field] = toUtc(timeZone, item[field]);
        }
    }
    return item;
};

// Value helpers ---------------------------------------------------------------------------

const isEmpty = (value) => value === undefined || value === null || value === '';

/**
 * Parse a numeric ID typed into a text input or mapped from a variable.
 * @param {object} context
 * @param {*} value
 * @param {string} label
 * @returns {number|undefined}
 */
const toInteger = (context, value, label) => {

    if (isEmpty(value)) {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isInteger(number)) {
        throw cancelError(context, label + ' must be a whole number.');
    }
    return number;
};

const toNumber = (context, value, label) => {

    if (isEmpty(value)) {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
        throw cancelError(context, label + ' must be a number.');
    }
    return number;
};

/**
 * Turn a date input into the wall clock of the tenant SuperOffice stores ("2026-12-01T13:00:00"):
 * an instant (a value with Z or an offset) is converted to the tenant's time zone, a value
 * without an offset is taken as the tenant's wall clock already.
 * @param {object} context
 * @param {*} value
 * @param {string} label
 * @returns {string|undefined}
 */
const toIsoDate = (context, value, label) => {

    if (isEmpty(value)) {
        return undefined;
    }
    // Without an offset the value already is the tenant's wall clock (never the server's local time)
    const wall = wallClockMs(value);
    if (wall !== undefined) {
        return formatWallClock(wall);
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw cancelError(context, label + ' is not a valid date.');
    }
    const timeZone = timeZones.get(context);
    if (!timeZone) {
        throw new Error('The SuperOffice time zone is not loaded: read the tenant before converting ' + label + '.');
    }
    return formatWallClock(date.getTime() + offsetAt(timeZone, date.getTime()) * 60000);
};

/**
 * A number read from an archive row: SLIM rows carry display values, so numbers may arrive
 * as strings. Returns a number when the value is numeric, otherwise undefined.
 * @param {*} value
 * @returns {number|undefined}
 */
const rowNumber = (value) => {

    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
        return Number(value);
    }
    return undefined;
};

const rowString = (value) => (isEmpty(value) ? undefined : String(value));

const firstValue = (elements) => {

    return Array.isArray(elements) && elements.length && elements[0] ? elements[0].Value : undefined;
};

/**
 * Set the first element of an EntityElement collection (Emails, Phones, Urls).
 * @param {object[]} elements
 * @param {string} value
 * @returns {object[]}
 */
const withFirstValue = (elements, value) => {

    const list = Array.isArray(elements) ? elements.slice() : [];
    if (list.length) {
        list[0] = { ...list[0], Value: value };
    } else {
        list.push({ Value: value });
    }
    return list;
};

/**
 * Drop empty values so that optional fields the API did not return stay absent.
 * @param {object} item
 * @returns {object}
 */
const compact = (item) => {

    return Object.keys(item).reduce((res, key) => {
        if (item[key] !== undefined && item[key] !== null) {
            res[key] = item[key];
        }
        return res;
    }, {});
};

/**
 * OData string literal: single quotes are doubled.
 * @param {string} value
 * @returns {string}
 */
const quote = (value) => "'" + String(value).replace(/'/g, "''") + "'";

// Entities --------------------------------------------------------------------------------

// Item schemas shared by Get, Create, Find and the New* triggers of each entity. The API
// "Contact" is a company and "Person" a contact person; the components use the UI names.
const ITEM_SCHEMAS = {

    company: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
            id: { type: 'integer', title: 'Company ID', example: 125 },
            name: { type: 'string', title: 'Name', example: 'Acme Inc.' },
            department: { type: 'string', title: 'Department', example: 'Sales' },
            orgNr: { type: 'string', title: 'Organization Number', example: '987654321' },
            category: { type: 'string', title: 'Category', example: 'Customer' },
            business: { type: 'string', title: 'Business', example: 'IT' },
            country: { type: 'string', title: 'Country', example: 'Norway' },
            email: { type: 'string', title: 'Email', example: 'info@acme.example' },
            phone: { type: 'string', title: 'Phone', example: '+47 22 00 00 00' },
            website: { type: 'string', title: 'Website', example: 'https://acme.example' },
            description: { type: 'string', title: 'Description', example: 'Reseller for the Nordic market.' },
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
        }
    },

    person: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', title: 'Person ID', example: 342 },
            firstName: { type: 'string', title: 'First Name', example: 'Jane' },
            lastName: { type: 'string', title: 'Last Name', example: 'Doe' },
            fullName: { type: 'string', title: 'Full Name', example: 'Jane Doe' },
            title: { type: 'string', title: 'Title', example: 'Head of Purchasing' },
            position: { type: 'string', title: 'Position', example: 'Purchaser' },
            companyId: { type: 'integer', title: 'Company ID', example: 125 },
            companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
            email: { type: 'string', title: 'Email', example: 'jane.doe@acme.example' },
            mobilePhone: { type: 'string', title: 'Mobile Phone', example: '+47 900 00 000' },
            officePhone: { type: 'string', title: 'Office Phone', example: '+47 22 00 00 01' },
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
        }
    },

    sale: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', title: 'Sale ID', example: 57 },
            heading: { type: 'string', title: 'Heading', example: '50 licences' },
            amount: { type: 'number', title: 'Amount', example: 12500 },
            saleDate: { type: 'string', title: 'Sale Date', example: '2026-12-15T00:00:00Z' },
            status: { type: 'string', title: 'Status', example: 'Open' },
            probability: { type: 'integer', title: 'Probability', example: 50 },
            saleType: { type: 'string', title: 'Sale Type', example: 'New business' },
            companyId: { type: 'integer', title: 'Company ID', example: 125 },
            companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
            personId: { type: 'integer', title: 'Person ID', example: 342 },
            personName: { type: 'string', title: 'Person Name', example: 'Jane Doe' },
            projectId: { type: 'integer', title: 'Project ID', example: 12 },
            description: { type: 'string', title: 'Description', example: 'Renewal of the yearly licence.' },
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
        }
    },

    project: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
            id: { type: 'integer', title: 'Project ID', example: 12 },
            name: { type: 'string', title: 'Name', example: 'Website relaunch' },
            number: { type: 'string', title: 'Project Number', example: '10012' },
            type: { type: 'string', title: 'Project Type', example: 'Internal' },
            status: { type: 'string', title: 'Project Status', example: 'In progress' },
            description: { type: 'string', title: 'Description', example: 'Relaunch of the public website.' },
            startDate: { type: 'string', title: 'Start Date', example: '2026-11-16T00:00:00Z' },
            endDate: { type: 'string', title: 'End Date', example: '2027-02-28T00:00:00Z' },
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
        }
    },

    appointment: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', title: 'Follow-up ID', example: 981 },
            title: { type: 'string', title: 'Title', example: 'Kick-off meeting' },
            description: { type: 'string', title: 'Description', example: 'Agree on the project plan.' },
            startDate: { type: 'string', title: 'Start Date', example: '2026-11-20T09:00:00Z' },
            endDate: { type: 'string', title: 'End Date', example: '2026-11-20T10:00:00Z' },
            task: { type: 'string', title: 'Task', example: 'Meeting' },
            type: { type: 'string', title: 'Type', example: 'inDiary' },
            completed: { type: 'string', title: 'Completed', example: 'NotStarted' },
            location: { type: 'string', title: 'Location', example: 'Meeting room 1' },
            companyId: { type: 'integer', title: 'Company ID', example: 125 },
            companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
            personId: { type: 'integer', title: 'Person ID', example: 342 },
            personName: { type: 'string', title: 'Person Name', example: 'Jane Doe' },
            projectId: { type: 'integer', title: 'Project ID', example: 12 },
            saleId: { type: 'integer', title: 'Sale ID', example: 57 },
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
        }
    }
};

const ref = (object, key) => (object && object[key] ? object[key] : undefined);

/**
 * SuperOffice keeps one appointment text: Description is Title (its first line) and Agenda (the
 * rest) joined by a line break. When Title is sent, Description is rebuilt from Title and Agenda,
 * so a Description sent next to it is lost. The component's "description" is the Agenda part.
 * @param {object} entity current or default AppointmentEntity
 * @param {object} input component inputs
 * Without a title only Description is sent (Title and Agenda are dropped from the entity), and
 * SuperOffice takes its first line as the title.
 * @returns {object} Title, Agenda and Description to set, or {} when neither input is given
 */
const appointmentText = (entity, input) => {

    if (isEmpty(input.title) && isEmpty(input.description)) {
        return {};
    }
    const title = isEmpty(input.title) ? (entity.Title || '') : String(input.title);
    const agenda = isEmpty(input.description) ? (entity.Agenda || '') : String(input.description);
    if (!title) {
        return { Description: agenda };
    }
    return {
        Title: title,
        Agenda: agenda,
        Description: agenda ? title + '\r\n' + agenda : title
    };
};

/**
 * The archive "text" column holds the whole appointment text: first line title, rest description.
 * @param {string|undefined} text
 * @returns {{title: (string|undefined), description: (string|undefined)}}
 */
const splitAppointmentText = (text) => {

    if (text === undefined) {
        return {};
    }
    const [first, ...rest] = text.split(/\r?\n/);
    const description = rest.join('\n');
    return { title: first || undefined, description: description || undefined };
};
const positive = (value) => (typeof value === 'number' && value > 0 ? value : undefined);

/**
 * Per entity: the REST resource, the archive columns the Find components and triggers read
 * ($select; with $jsonSafe=true "a/b" comes back as "a__b"), the mapping of an entity and of an
 * archive row to the shared item shape, and how component inputs become entity fields.
 */
const ENTITIES = {

    company: {
        resource: 'Contact',
        label: 'Company',
        primaryKey: 'contactId',
        select: [
            'contactId', 'name', 'department', 'orgnr', 'category', 'business', 'country',
            'email/emailAddress', 'phone/formattedNumber', 'registeredDate', 'updatedDate'
        ],
        fromEntity: (e) => compact({
            id: e.ContactId,
            name: e.Name,
            department: e.Department,
            orgNr: e.OrgNr,
            category: ref(e.Category, 'Value'),
            business: ref(e.Business, 'Value'),
            country: ref(e.Country, 'Name'),
            email: firstValue(e.Emails),
            phone: firstValue(e.Phones),
            website: firstValue(e.Urls),
            description: e.Description,
            createdDate: e.CreatedDate,
            updatedDate: realDate(e.UpdatedDate)
        }),
        fromRow: (r) => compact({
            id: rowNumber(r.contactId),
            name: rowString(r.name),
            department: rowString(r.department),
            orgNr: rowString(r.orgnr),
            category: rowString(r.category),
            business: rowString(r.business),
            country: rowString(r.country),
            email: rowString(r.email__emailAddress),
            phone: rowString(r.phone__formattedNumber),
            createdDate: rowString(r.registeredDate),
            updatedDate: rowString(r.updatedDate)
        }),
        apply: (context, entity, input) => {
            const e = { ...entity };
            if (!isEmpty(input.name)) e.Name = input.name;
            if (!isEmpty(input.department)) e.Department = input.department;
            if (!isEmpty(input.orgNr)) e.OrgNr = input.orgNr;
            if (!isEmpty(input.description)) e.Description = input.description;
            const categoryId = toInteger(context, input.categoryId, 'Category');
            if (categoryId !== undefined) e.Category = { Id: categoryId };
            const businessId = toInteger(context, input.businessId, 'Business');
            if (businessId !== undefined) e.Business = { Id: businessId };
            const countryId = toInteger(context, input.countryId, 'Country');
            if (countryId !== undefined) e.Country = { CountryId: countryId };
            if (!isEmpty(input.email)) e.Emails = withFirstValue(e.Emails, input.email);
            if (!isEmpty(input.phone)) e.Phones = withFirstValue(e.Phones, input.phone);
            if (!isEmpty(input.website)) e.Urls = withFirstValue(e.Urls, input.website);
            return e;
        }
    },

    person: {
        resource: 'Person',
        label: 'Person',
        primaryKey: 'personId',
        select: [
            'personId', 'firstName', 'lastName', 'fullName', 'title', 'position', 'contactId', 'personContact/name',
            'email/emailAddress', 'personRegisteredDate', 'personUpdatedDate'
        ],
        fromEntity: (e) => compact({
            id: e.PersonId,
            firstName: e.Firstname,
            lastName: e.Lastname,
            fullName: e.FullName,
            title: e.Title,
            position: ref(e.Position, 'Value'),
            companyId: positive(ref(e.Contact, 'ContactId')),
            companyName: ref(e.Contact, 'Name'),
            email: firstValue(e.Emails),
            mobilePhone: firstValue(e.MobilePhones),
            officePhone: firstValue(e.OfficePhones),
            createdDate: e.CreatedDate,
            updatedDate: realDate(e.UpdatedDate)
        }),
        fromRow: (r) => compact({
            id: rowNumber(r.personId),
            firstName: rowString(r.firstName),
            lastName: rowString(r.lastName),
            fullName: rowString(r.fullName),
            title: rowString(r.title),
            position: rowString(r.position),
            companyId: positive(rowNumber(r.contactId)),
            companyName: rowString(r.personContact__name),
            email: rowString(r.email__emailAddress),
            createdDate: rowString(r.personRegisteredDate),
            updatedDate: rowString(r.personUpdatedDate)
        }),
        apply: (context, entity, input) => {
            const e = { ...entity };
            const companyId = toInteger(context, input.companyId, 'Company ID');
            if (companyId !== undefined) e.Contact = { ContactId: companyId };
            if (!isEmpty(input.firstName)) e.Firstname = input.firstName;
            if (!isEmpty(input.lastName)) e.Lastname = input.lastName;
            if (!isEmpty(input.title)) e.Title = input.title;
            const positionId = toInteger(context, input.positionId, 'Position');
            if (positionId !== undefined) e.Position = { Id: positionId };
            if (!isEmpty(input.email)) e.Emails = withFirstValue(e.Emails, input.email);
            if (!isEmpty(input.mobilePhone)) e.MobilePhones = withFirstValue(e.MobilePhones, input.mobilePhone);
            if (!isEmpty(input.officePhone)) e.OfficePhones = withFirstValue(e.OfficePhones, input.officePhone);
            return e;
        }
    },

    sale: {
        resource: 'Sale',
        label: 'Sale',
        primaryKey: 'saleId',
        select: [
            'saleId', 'heading', 'amount', 'date', 'saleStatus', 'saleType', 'contact/contactId', 'contact/name',
            'person/personId', 'person/fullName', 'project/projectId', 'description', 'registeredDate', 'updatedDate'
        ],
        fromEntity: (e) => compact({
            id: e.SaleId,
            heading: e.Heading,
            amount: e.Amount,
            saleDate: e.Saledate,
            status: e.Status,
            probability: e.Probability,
            saleType: ref(e.SaleType, 'Value'),
            companyId: positive(ref(e.Contact, 'ContactId')),
            companyName: ref(e.Contact, 'Name'),
            personId: positive(ref(e.Person, 'PersonId')),
            personName: ref(e.Person, 'FullName'),
            projectId: positive(ref(e.Project, 'ProjectId')),
            description: e.SaleText,
            createdDate: e.CreatedDate,
            updatedDate: realDate(e.UpdatedDate)
        }),
        fromRow: (r) => compact({
            id: rowNumber(r.saleId),
            heading: rowString(r.heading),
            amount: rowNumber(r.amount),
            saleDate: rowString(r.date),
            status: rowString(r.saleStatus),
            saleType: rowString(r.saleType),
            companyId: positive(rowNumber(r.contact__contactId)),
            companyName: rowString(r.contact__name),
            personId: positive(rowNumber(r.person__personId)),
            personName: rowString(r.person__fullName),
            projectId: positive(rowNumber(r.project__projectId)),
            description: rowString(r.description),
            createdDate: rowString(r.registeredDate),
            updatedDate: rowString(r.updatedDate)
        }),
        apply: (context, entity, input) => {
            const e = { ...entity };
            if (!isEmpty(input.heading)) e.Heading = input.heading;
            const companyId = toInteger(context, input.companyId, 'Company ID');
            if (companyId !== undefined) e.Contact = { ContactId: companyId };
            const personId = toInteger(context, input.personId, 'Person ID');
            if (personId !== undefined) e.Person = { PersonId: personId };
            const projectId = toInteger(context, input.projectId, 'Project ID');
            if (projectId !== undefined) e.Project = { ProjectId: projectId };
            const amount = toNumber(context, input.amount, 'Amount');
            if (amount !== undefined) e.Amount = amount;
            const saleDate = toIsoDate(context, input.saleDate, 'Sale Date');
            if (saleDate !== undefined) e.Saledate = saleDate;
            const probability = toInteger(context, input.probability, 'Probability');
            if (probability !== undefined) e.Probability = probability;
            const saleTypeId = toInteger(context, input.saleTypeId, 'Sale Type');
            if (saleTypeId !== undefined) e.SaleType = { Id: saleTypeId };
            if (!isEmpty(input.status)) e.Status = input.status;
            if (!isEmpty(input.description)) e.SaleText = input.description;
            return e;
        }
    },

    project: {
        resource: 'Project',
        label: 'Project',
        primaryKey: 'projectId',
        select: [
            'projectId', 'name', 'number', 'type', 'status', 'description', 'startDate', 'endDate',
            'registeredDate', 'updatedDate'
        ],
        fromEntity: (e) => compact({
            id: e.ProjectId,
            name: e.Name,
            number: e.ProjectNumber,
            type: ref(e.ProjectType, 'Value'),
            status: ref(e.ProjectStatus, 'Value'),
            description: e.Description,
            startDate: e.StartDate,
            endDate: e.EndDate,
            createdDate: e.CreatedDate,
            updatedDate: realDate(e.UpdatedDate)
        }),
        fromRow: (r) => compact({
            id: rowNumber(r.projectId),
            name: rowString(r.name),
            number: rowString(r.number),
            type: rowString(r.type),
            status: rowString(r.status),
            description: rowString(r.description),
            startDate: rowString(r.startDate),
            endDate: rowString(r.endDate),
            createdDate: rowString(r.registeredDate),
            updatedDate: rowString(r.updatedDate)
        }),
        apply: (context, entity, input) => {
            const e = { ...entity };
            if (!isEmpty(input.name)) e.Name = input.name;
            if (!isEmpty(input.description)) e.Description = input.description;
            const projectTypeId = toInteger(context, input.projectTypeId, 'Project Type');
            if (projectTypeId !== undefined) e.ProjectType = { Id: projectTypeId };
            const projectStatusId = toInteger(context, input.projectStatusId, 'Project Status');
            if (projectStatusId !== undefined) e.ProjectStatus = { Id: projectStatusId };
            const startDate = toIsoDate(context, input.startDate, 'Start Date');
            if (startDate !== undefined) e.StartDate = startDate;
            const endDate = toIsoDate(context, input.endDate, 'End Date');
            if (endDate !== undefined) e.EndDate = endDate;
            return e;
        }
    },

    appointment: {
        resource: 'Appointment',
        label: 'Follow-up',
        primaryKey: 'appointmentId',
        select: [
            'appointmentId', 'text', 'date', 'endDate', 'type', 'location', 'contact/contactId', 'contact/name',
            'person/personId', 'person/fullName', 'project/projectId', 'saleId', 'registeredDate', 'updatedDate'
        ],
        fromEntity: (e) => compact({
            id: e.AppointmentId,
            title: e.Title,
            description: e.Agenda || undefined,
            startDate: e.StartDate,
            endDate: e.EndDate,
            task: ref(e.Task, 'Value'),
            type: e.Type,
            completed: e.Completed,
            location: e.Location,
            companyId: positive(ref(e.Contact, 'ContactId')),
            companyName: ref(e.Contact, 'Name'),
            personId: positive(ref(e.Person, 'PersonId')),
            personName: ref(e.Person, 'FullName'),
            projectId: positive(ref(e.Project, 'ProjectId')),
            saleId: positive(ref(e.Sale, 'SaleId')),
            createdDate: e.CreatedDate,
            updatedDate: realDate(e.UpdatedDate)
        }),
        fromRow: (r) => compact({
            id: rowNumber(r.appointmentId),
            ...splitAppointmentText(rowString(r.text)),
            startDate: rowString(r.date),
            endDate: rowString(r.endDate),
            task: rowString(r.type),
            location: rowString(r.location),
            companyId: positive(rowNumber(r.contact__contactId)),
            companyName: rowString(r.contact__name),
            personId: positive(rowNumber(r.person__personId)),
            personName: rowString(r.person__fullName),
            projectId: positive(rowNumber(r.project__projectId)),
            saleId: positive(rowNumber(r.saleId)),
            createdDate: rowString(r.registeredDate),
            updatedDate: rowString(r.updatedDate)
        }),
        apply: (context, entity, input) => {
            const e = { ...entity };
            const text = appointmentText(e, input);
            if (text.Description !== undefined && text.Title === undefined) {
                delete e.Title;
                delete e.Agenda;
            }
            Object.assign(e, text);
            if (!isEmpty(input.location)) e.Location = input.location;
            const startDate = toIsoDate(context, input.startDate, 'Start Date');
            if (startDate !== undefined) e.StartDate = startDate;
            const endDate = toIsoDate(context, input.endDate, 'End Date');
            if (endDate !== undefined) e.EndDate = endDate;
            const taskId = toInteger(context, input.taskId, 'Task');
            if (taskId !== undefined) e.Task = { TaskListItemId: taskId };
            const companyId = toInteger(context, input.companyId, 'Company ID');
            if (companyId !== undefined) e.Contact = { ContactId: companyId };
            const personId = toInteger(context, input.personId, 'Person ID');
            if (personId !== undefined) e.Person = { PersonId: personId };
            const projectId = toInteger(context, input.projectId, 'Project ID');
            if (projectId !== undefined) e.Project = { ProjectId: projectId };
            const saleId = toInteger(context, input.saleId, 'Sale ID');
            if (saleId !== undefined) e.Sale = { SaleId: saleId };
            if (!isEmpty(input.type)) e.Type = input.type;
            if (!isEmpty(input.completed)) e.Completed = input.completed;
            return e;
        }
    }
};

const entityConfig = (type) => {

    const config = ENTITIES[type];
    if (!config) {
        throw new Error('Unknown entity ' + type);
    }
    return config;
};

const entityPath = (context, type, id) => {

    const config = entityConfig(type);
    const numericId = toInteger(context, id, config.label + ' ID');
    if (numericId === undefined || numericId <= 0) {
        throw cancelError(context, config.label + ' ID must be a positive whole number.');
    }
    return '/' + config.resource + '/' + numericId;
};

/**
 * GET /{Entity}/{id} mapped to the item shape.
 * @param {object} context
 * @param {string} type company | person | sale | project | appointment
 * @param {*} id
 * @returns {Promise<object>}
 */
const getItem = async (context, type, id) => {

    const entity = await request(context, { path: entityPath(context, type, id) });
    return withUtcDates(context, entityConfig(type).fromEntity(entity));
};

/**
 * Create an entity: GET /{Entity}/default returns a pre-filled entity (owner, defaults) that
 * a sparse body would miss; the inputs are applied to it and it is POSTed.
 * @param {object} context
 * @param {string} type
 * @param {object} input component inputs
 * @returns {Promise<object>} created item
 */
const createItem = async (context, type, input) => {

    const config = entityConfig(type);
    const template = await request(context, { path: '/' + config.resource + '/default' });
    const entity = config.apply(context, template || {}, input);
    const created = await request(context, { method: 'POST', path: '/' + config.resource, data: entity });
    return withUtcDates(context, config.fromEntity(created));
};

/**
 * Update an entity: the current entity is read, the provided inputs are applied, and the
 * whole entity is saved with PUT /{Entity}/{id}. Empty inputs keep the stored values.
 * @param {object} context
 * @param {string} type
 * @param {*} id
 * @param {object} input
 * @returns {Promise<void>}
 */
const updateItem = async (context, type, id, input) => {

    const config = entityConfig(type);
    const path = entityPath(context, type, id);
    const current = await request(context, { path });
    const entity = config.apply(context, current, input);
    await request(context, { method: 'PUT', path, data: entity });
};

const deleteItem = async (context, type, id) => {

    await request(context, { method: 'DELETE', path: entityPath(context, type, id) });
};

/**
 * Read one page of the entity archive (GET /{Entity}, an OData query on the archive provider)
 * and map the rows to the item shape. A row repeats when a company or person has several
 * email addresses; only the first row of each ID is kept.
 * @param {object} context
 * @param {string} type
 * @param {object} options
 * @param {string[]} [options.filters] $filter expressions joined with "and"
 * @param {string} [options.orderBy]
 * @param {number} [options.top]
 * @returns {Promise<{items: object[], truncated: boolean}>}
 */
const findItems = async (context, type, { filters = [], orderBy, top = PAGE_SIZE } = {}) => {

    const config = entityConfig(type);
    const params = {
        $select: config.select.join(','),
        $top: top,
        $jsonSafe: true
    };
    const filter = filters.filter(Boolean).map(item => '(' + item + ')').join(' and ');
    if (filter) {
        params.$filter = filter;
    }
    if (orderBy) {
        params.$orderBy = orderBy;
    }
    const body = await request(context, { path: '/' + config.resource, params });
    const rows = body && Array.isArray(body.value) ? body.value : [];
    const seen = new Set();
    const items = [];
    for (const row of rows) {
        const item = withUtcDates(context, config.fromRow(row || {}));
        if (item.id === undefined || seen.has(item.id)) {
            continue;
        }
        seen.add(item.id);
        items.push(item);
    }
    return { items, truncated: rows.length >= top };
};

/**
 * The newest items of an entity, by primary key descending (IDs are assigned in ascending order).
 * Used by the New* triggers' tick() and test().
 * @param {object} context
 * @param {string} type
 * @param {number} top
 * @returns {Promise<{items: object[], truncated: boolean}>}
 */
const newestItems = (context, type, top = TRIGGER_PAGE_SIZE) => {

    const config = entityConfig(type);
    return findItems(context, type, { orderBy: config.primaryKey + ' desc', top });
};

/**
 * Shared tick() of the New* polling triggers. The first tick records the current items; later
 * ticks emit items not seen before. When the page was full, items not newer than the oldest ID
 * read (the floor) are not new: they were pulled onto the page because a newer item went away.
 * @param {object} context
 * @param {string} type
 */
const pollNewItems = async (context, type) => {

    const state = (await context.loadState()) || {};
    const known = Array.isArray(state.known) ? new Set(state.known) : null;
    const { floor } = state;
    const { items, truncated } = await newestItems(context, type);

    // An empty answer while items are known is not saved: the next tick would fire them all again.
    if (known && known.size && !items.length) {
        return;
    }

    if (known) {
        const fresh = items.filter(item => !known.has(item.id) && (!floor || item.id > floor));
        // Oldest first, so that downstream steps see items in creation order.
        for (const item of fresh.reverse()) {
            await context.sendJson(item, 'out');
        }
    }

    const oldest = items[items.length - 1];
    await context.saveState({
        known: items.map(item => item.id),
        floor: oldest && truncated ? oldest.id : null
    });
};

// Lists -----------------------------------------------------------------------------------

// Lists the components offer as dropdowns: GET /api/v1/List/{name}/MDOItems.
const LIST_NAMES = ['Category', 'Business', 'Country', 'Position', 'Currency', 'SaleType', 'ProjectType', 'ProjectStatus', 'Task'];

const flattenListItems = (items, out = []) => {

    for (const item of items || []) {
        if (!item) {
            continue;
        }
        if (typeof item.Id === 'number' && item.Id > 0 && !item.Deleted) {
            out.push(compact({ id: item.Id, name: item.Name, fullName: item.FullName, tooltip: item.ToolTip }));
        }
        if (Array.isArray(item.ChildItems) && item.ChildItems.length) {
            flattenListItems(item.ChildItems, out);
        }
    }
    return out;
};

/**
 * Items of a SuperOffice list (category, business, sale type, ...), headings left out.
 * @param {object} context
 * @param {string} listName one of LIST_NAMES
 * @returns {Promise<object[]>}
 */
const listItems = async (context, listName) => {

    if (!LIST_NAMES.includes(listName)) {
        throw cancelError(context, 'List must be one of: ' + LIST_NAMES.join(', ') + '.');
    }
    const body = await request(context, { path: '/List/' + listName + '/MDOItems', params: { flat: true } });
    return flattenListItems(Array.isArray(body) ? body : []);
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

    const key = 'superoffice-' + getCacheKey({
        ...keyParts,
        environment: getEnvironment(context),
        tenantId: getTenantId(context),
        token: context.auth && context.auth.accessToken
    });
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

// MakeApiCall helpers ---------------------------------------------------------------------

/**
 * Resolve a user supplied endpoint against the tenant API root (https://<host>/<CustNNNNN>/api)
 * and refuse anything that would send the account's credential somewhere else: another origin,
 * a path outside the tenant API, credentials in the URL or protocol-relative input.
 * @param {object} context
 * @param {string} url relative path, e.g. /v1/Contact/123, or a full URL on the tenant API
 * @param {string} apiBase REST v1 base from getApiBase()
 * @returns {string}
 */
const resolveApiUrl = (context, url, apiBase) => {

    const root = apiBase.replace(/\/v1$/, '');
    const rootUrl = new URL(root);
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');

    let parsed;
    try {
        parsed = isAbsolute
            ? new URL(url)
            : new URL(root + (url.startsWith('/') ? '' : '/') + url);
    } catch (error) {
        throw new context.CancelError('API Endpoint Path is not a valid URL: ' + url);
    }

    if (parsed.username || parsed.password) {
        throw new context.CancelError('API Endpoint Path must not contain credentials.');
    }
    if (parsed.origin !== rootUrl.origin) {
        throw new context.CancelError('API Endpoint Path must target ' + root + ', got ' + parsed.origin + '.');
    }
    const prefix = rootUrl.pathname.toLowerCase() + '/';
    if (!(parsed.pathname.toLowerCase() + '/').startsWith(prefix) || /(^|\/)\.\.?(\/|$)/.test(url.split(/[?#]/)[0])) {
        throw new context.CancelError('API Endpoint Path must stay under ' + root + '.');
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

/**
 * Parse a textarea JSON input. Empty input means "no body"; an object is passed through.
 * @param {object} context
 * @param {string|object} value
 * @param {string} label
 * @returns {object|undefined}
 */
const parseJsonInput = (context, value, label) => {

    if (isEmpty(value)) {
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

// Tickets ---------------------------------------------------------------------------------

// SuperOffice returns 0001-01-01 for a date that is not set (a ticket that is not closed).
const realDate = (value) => (typeof value === 'string' && !value.startsWith('0001-') ? value : undefined);

ITEM_SCHEMAS.ticket = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'Ticket ID', example: 4021 },
        title: { type: 'string', title: 'Title', example: 'Cannot log in to the portal' },
        status: { type: 'string', title: 'Base Status', example: 'Closed' },
        statusId: { type: 'integer', title: 'Status ID', example: 2 },
        statusName: { type: 'string', title: 'Status', example: 'Closed' },
        categoryId: { type: 'integer', title: 'Category ID', example: 3 },
        categoryName: { type: 'string', title: 'Category', example: 'Support/Login' },
        priorityName: { type: 'string', title: 'Priority', example: 'Medium' },
        origin: { type: 'string', title: 'Origin', example: 'Email' },
        personId: { type: 'integer', title: 'Person ID', example: 342 },
        personName: { type: 'string', title: 'Person Name', example: 'Jane Doe' },
        companyId: { type: 'integer', title: 'Company ID', example: 125 },
        companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
        saleId: { type: 'integer', title: 'Sale ID', example: 57 },
        projectId: { type: 'integer', title: 'Project ID', example: 12 },
        deadline: { type: 'string', title: 'Deadline', example: '2026-11-21T16:00:00Z' },
        closedAt: { type: 'string', title: 'Closed At', example: '2026-11-18T14:05:00Z' },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-18T14:05:00Z' }
    }
};

ENTITIES.ticket = {
    resource: 'Ticket',
    label: 'Ticket',
    primaryKey: 'ticketId',
    select: ['ticketId', 'title', 'ticketStatusName', 'contactId', 'personId', 'createdAt', 'lastChanged'],
    fromEntity: (e) => compact({
        id: e.TicketId,
        title: e.Title,
        status: e.BaseStatus,
        statusId: positive(ref(e.Status, 'TicketStatusId')),
        statusName: ref(e.Status, 'Name'),
        categoryId: positive(ref(e.Category, 'TicketCategoryId')),
        categoryName: ref(e.Category, 'Fullname') || ref(e.Category, 'Name'),
        priorityName: ref(e.Priority, 'Name'),
        origin: e.Origin,
        personId: positive(ref(e.Person, 'PersonId')),
        personName: ref(e.Person, 'FullName'),
        companyId: positive(ref(e.Person, 'ContactId')),
        companyName: ref(e.Person, 'ContactName'),
        saleId: positive(ref(e.Sale, 'SaleId')),
        projectId: positive(ref(e.Project, 'ProjectId')),
        deadline: realDate(e.Deadline),
        closedAt: realDate(e.ClosedAt),
        createdDate: realDate(e.CreatedAt),
        updatedDate: realDate(e.LastChanged)
    }),
    fromRow: (r) => compact({
        id: rowNumber(r.ticketId),
        title: rowString(r.title),
        statusName: rowString(r.ticketStatusName),
        companyId: positive(rowNumber(r.contactId)),
        personId: positive(rowNumber(r.personId)),
        createdDate: rowString(r.createdAt),
        updatedDate: rowString(r.lastChanged)
    }),
    apply: (context, entity, input) => {
        const e = { ...entity };
        if (!isEmpty(input.title)) e.Title = input.title;
        const statusId = toInteger(context, input.statusId, 'Status');
        if (statusId !== undefined) e.Status = { TicketStatusId: statusId };
        const categoryId = toInteger(context, input.categoryId, 'Category');
        if (categoryId !== undefined) e.Category = { TicketCategoryId: categoryId };
        const personId = toInteger(context, input.personId, 'Person ID');
        if (personId !== undefined) e.Person = { PersonId: personId };
        const deadline = toIsoDate(context, input.deadline, 'Deadline');
        if (deadline !== undefined) e.Deadline = deadline;
        return e;
    }
};

// Generic records -------------------------------------------------------------------------

// The objects of the generic components (Get / Find / Update Record, Record Updated). The keys
// are the ENTITIES keys; updatedColumn is the archive column Record Updated polls on, and the
// company, person and owner columns are the archive restrictions Find Records offers (a person
// has no owner).
const RECORD_OBJECTS = {
    company: { label: 'Company', updatedColumn: 'updatedDate', companyColumn: 'contactId', ownerColumn: 'associateId' },
    person: { label: 'Person', updatedColumn: 'personUpdatedDate', companyColumn: 'contactId', personColumn: 'personId' },
    sale: {
        label: 'Sale',
        updatedColumn: 'updatedDate',
        companyColumn: 'contact/contactId',
        personColumn: 'person/personId',
        ownerColumn: 'associateId'
    },
    project: { label: 'Project', updatedColumn: 'updatedDate', ownerColumn: 'associateId' },
    appointment: {
        label: 'Follow-up (appointment or task)',
        updatedColumn: 'updatedDate',
        companyColumn: 'contact/contactId',
        personColumn: 'person/personId',
        ownerColumn: 'associateId'
    },
    ticket: {
        label: 'Ticket (request)',
        updatedColumn: 'lastChanged',
        companyColumn: 'contactId',
        personColumn: 'personId',
        ownerColumn: 'ownedBy/associateDbId'
    }
};

const OBJECT_OPTIONS = Object.keys(RECORD_OBJECTS).map(key => ({ label: RECORD_OBJECTS[key].label, value: key }));

// Find Records reads every matching record in full (custom fields included), so it stops at 100.
const RECORD_PAGE_SIZE = 100;
// Record Updated reads the 200 most recently updated records of the object on every tick.
const UPDATED_PAGE_SIZE = 200;
// Previous values Record Updated keeps for the "changes" conditions.
const MAX_CONDITION_VALUES = 5000;

const CUSTOM_FIELD_PREFIX = 'cf_';

/**
 * The output key of a custom field: "SuperOffice:1" becomes cf_SuperOffice_1, "x_score" cf_x_score.
 * @param {string} fieldName prog-id of a user-defined field or database name of an extra field
 * @returns {string}
 */
const customFieldKey = (fieldName) => CUSTOM_FIELD_PREFIX + String(fieldName).replace(/[^A-Za-z0-9_]/g, '_');

const getRecordObject = (context, object) => {

    if (!RECORD_OBJECTS[object]) {
        throw cancelError(context, 'Object must be one of: ' + Object.keys(RECORD_OBJECTS).join(', ') + '.');
    }
    return RECORD_OBJECTS[object];
};

const pad = (value, length = 2) => String(value).padStart(length, '0');

/**
 * Decode a CustomFields value. SuperOffice encodes typed values in strings: [I:123] integer,
 * checkbox, list item or relation; [F:3.14] decimal; [D:MM/dd/yyyy] date; [DT:MM/dd/yyyy HH:mm:ss]
 * date and time; [T:...] time. Text is not encoded.
 * @param {*} value
 * @returns {*} number, ISO date string or the text
 */
const decodeCustomValue = (value) => {

    if (typeof value !== 'string') {
        return value;
    }
    const match = value.match(/^\[(I|F|D|DT|T):([\s\S]*)\]$/);
    if (!match) {
        return value;
    }
    const [, tag, raw] = match;
    if (raw.trim() === '') {
        return null;
    }
    if (tag === 'I' || tag === 'F') {
        const number = Number(raw);
        return Number.isFinite(number) ? number : raw;
    }
    const date = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (!date) {
        return raw;
    }
    const day = date[3] + '-' + pad(date[1]) + '-' + pad(date[2]);
    if (tag === 'D') {
        return day;
    }
    return day + 'T' + pad(date[4] || 0) + ':' + pad(date[5] || 0) + ':' + pad(date[6] || 0);
};

const TRUE_VALUES = ['true', '1', 'yes', 'on', 'checked'];

/**
 * Encode a value for the CustomFields dictionary according to the field type from the
 * CustomField metadata. A value that is already encoded ([I:..], [D:..], ...) is sent as it is.
 * @param {object} context
 * @param {*} value
 * @param {string} fieldType FieldInfoBase.FieldType
 * @param {string} label for error messages
 * @returns {string}
 */
const encodeCustomValue = (context, value, fieldType, label) => {

    if (typeof value === 'string' && /^\[(I|F|D|DT|T):[\s\S]*\]$/.test(value.trim())) {
        return value.trim();
    }
    const formatDate = (date) => pad(date.getUTCMonth() + 1) + '/' + pad(date.getUTCDate()) + '/' + date.getUTCFullYear();
    const formatTime = (date) => pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) + '.00000';
    const toDate = () => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw cancelError(context, label + ' is not a valid date.');
        }
        return date;
    };

    switch (fieldType) {
        case 'Integer':
        case 'MdoList':
        case 'RelationTo':
        case 'Attachment':
        case 'TimeSpan':
            return '[I:' + toInteger(context, value, label) + ']';
        case 'Checkbox':
            return '[I:' + (value === true || TRUE_VALUES.includes(String(value).trim().toLowerCase()) ? 1 : 0) + ']';
        case 'Decimal':
            return '[F:' + toNumber(context, value, label) + ']';
        case 'Date':
            return '[D:' + formatDate(toDate()) + ']';
        case 'DateTime': {
            const date = toDate();
            return '[DT:' + formatDate(date) + ' ' + formatTime(date) + ']';
        }
        case 'Time': {
            const date = toDate();
            return '[T:' + formatDate(date) + ' ' + formatTime(date) + ']';
        }
        default:
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
};

// Keys next to a custom field value that describe it (original value, display text) rather than hold it.
const CUSTOM_FIELD_DETAIL = /:(org|DisplayText|DisplayTooltip)$/;

/**
 * The custom field values of an entity (user-defined + extra fields), decoded. Older carriers
 * have them in UserDefinedFields and ExtraFields instead of CustomFields.
 * @param {object} entity
 * @returns {object} field name to value
 */
const customFieldsOf = (entity) => {

    const source = entity && entity.CustomFields && typeof entity.CustomFields === 'object'
        ? entity.CustomFields
        : { ...(entity && entity.UserDefinedFields), ...(entity && entity.ExtraFields) };
    const result = {};
    for (const [name, value] of Object.entries(source || {})) {
        if (CUSTOM_FIELD_DETAIL.test(name)) {
            continue;
        }
        result[name] = decodeCustomValue(value);
    }
    return result;
};

/**
 * DisplayName may be a multi-language string such as US:"Score";NO:"Poeng"; use the first label.
 * @param {string} value
 * @returns {string}
 */
const displayLabel = (value) => {

    if (typeof value !== 'string') {
        return value;
    }
    const match = value.match(/^[A-Za-z]{2}:"([^"]*)"/);
    return match ? match[1] : value;
};

/**
 * Metadata of the published custom fields of an object: GET /{Entity}/CustomField.
 * @param {object} context
 * @param {string} object
 * @returns {Promise<Array<{fieldName: string, key: string, label: string, fieldType: string, readOnly: boolean, mandatory: boolean}>>}
 */
const customFieldInfos = async (context, object) => {

    getRecordObject(context, object);
    const body = await request(context, { path: '/' + ENTITIES[object].resource + '/CustomField' });
    return (Array.isArray(body) ? body : [])
        .filter(info => info && info.FieldName)
        .sort((a, b) => (a.Rank || 0) - (b.Rank || 0))
        .map(info => ({
            fieldName: info.FieldName,
            key: customFieldKey(info.FieldName),
            label: displayLabel(info.DisplayName) || info.FieldName,
            fieldType: info.FieldType || 'Unknown',
            readOnly: Boolean(info.IsReadOnly),
            mandatory: Boolean(info.IsMandatory)
        }));
};

const customFieldInfosCached = (context, object) => {

    return callCached(context, { op: 'customFieldInfos', object }, () => customFieldInfos(context, object));
};

const ownerOf = (object, entity) => (object === 'ticket' ? entity.OwnedBy : entity.Associate);

/**
 * Map an entity of any object to the generic record: the fields of the per-object components,
 * the object name, the owner (our contact, ticket owner) and the custom fields, both as the
 * customFields dictionary and as one cf_* field each.
 * @param {string} object
 * @param {object} entity
 * @param {object} [context] with it, the date-times are converted to UTC
 * @returns {object}
 */
const toRecord = (object, entity, context) => {

    const e = entity || {};
    const owner = ownerOf(object, e);
    const ownerId = positive(ref(owner, 'AssociateId'));
    const record = {
        object,
        ...ENTITIES[object].fromEntity(e),
        ownerId,
        // An unassigned ticket carries a resource placeholder instead of a name
        ownerName: ownerId ? ref(owner, 'FullName') || ref(owner, 'Name') : undefined
    };
    if (object === 'appointment') {
        record.ticketId = positive(ref(e.Ticket, 'TicketId'));
    }
    const custom = customFieldsOf(e);
    if (Object.keys(custom).length) {
        record.customFields = custom;
        for (const [name, value] of Object.entries(custom)) {
            const key = customFieldKey(name);
            if (record[key] === undefined) {
                record[key] = value;
            }
        }
    }
    return withUtcDates(context, compact(record));
};

/**
 * Read one entity; resolves to null when it does not exist (deleted meanwhile).
 * @param {object} context
 * @param {string} object
 * @param {*} id
 * @returns {Promise<object|null>}
 */
const getEntityOrNull = async (context, object, id) => {

    try {
        return await request(context, { path: entityPath(context, object, id) });
    } catch (err) {
        if (/\(404\)/.test(err && err.message)) {
            return null;
        }
        throw err;
    }
};

/**
 * GET /{Entity}/{id} mapped to the generic record.
 * @param {object} context
 * @param {string} object
 * @param {*} id
 * @returns {Promise<object>}
 */
const getRecord = async (context, object, id) => {

    getRecordObject(context, object);
    const entity = await request(context, { path: entityPath(context, object, id) });
    return toRecord(object, entity, context);
};

/**
 * Read records one after another (the quota allows 10 requests a second), dropping records
 * deleted since the archive listed them.
 * @param {object} context
 * @param {string} object
 * @param {number[]} ids
 * @returns {Promise<object[]>}
 */
const getRecords = async (context, object, ids) => {

    const records = [];
    for (const id of ids) {
        const entity = await getEntityOrNull(context, object, id);
        if (entity) {
            records.push(toRecord(object, entity, context));
        }
    }
    return records;
};

/**
 * Archive rows of an object (GET /{Entity} with an OData query) reduced to IDs.
 * @param {object} context
 * @param {string} object
 * @param {object} options
 * @param {string[]} [options.columns] columns to read besides the primary key
 * @param {string[]} [options.filters]
 * @param {string} [options.orderBy]
 * @param {number} options.top
 * @returns {Promise<{rows: object[], truncated: boolean}>} rows with id and the raw row
 */
const archiveRows = async (context, object, { columns = [], filters = [], orderBy, top }) => {

    const config = ENTITIES[object];
    const params = {
        $select: [config.primaryKey, ...columns].join(','),
        $top: top,
        $jsonSafe: true
    };
    const filter = filters.filter(Boolean).map(item => '(' + item + ')').join(' and ');
    if (filter) {
        params.$filter = filter;
    }
    if (orderBy) {
        params.$orderBy = orderBy;
    }
    const body = await request(context, { path: '/' + config.resource, params });
    const raw = body && Array.isArray(body.value) ? body.value : [];
    const seen = new Set();
    const rows = [];
    for (const row of raw) {
        const id = rowNumber(row && row[config.primaryKey]);
        if (id === undefined || id <= 0 || seen.has(id)) {
            continue;
        }
        seen.add(id);
        rows.push({ id, row });
    }
    return { rows, truncated: raw.length >= top };
};

/**
 * Find Records: archive filter, newest first, then every match read in full.
 * @param {object} context
 * @param {string} object
 * @param {object} input
 * @returns {Promise<object[]>}
 */
const findRecords = async (context, object, { companyId, personId, ownerId, filter } = {}) => {

    const config = getRecordObject(context, object);
    const filters = [];
    const company = toInteger(context, companyId, 'Company ID');
    if (company !== undefined) {
        if (!config.companyColumn) {
            throw cancelError(context, 'Company ID cannot filter ' + config.label + ' records. Use Additional Filter.');
        }
        filters.push(config.companyColumn + ' eq ' + company);
    }
    const person = toInteger(context, personId, 'Person ID');
    if (person !== undefined) {
        if (!config.personColumn) {
            throw cancelError(context, 'Person ID cannot filter ' + config.label + ' records. Use Additional Filter.');
        }
        filters.push(config.personColumn + ' eq ' + person);
    }
    // The owner restricts the archive query itself: filtering the page afterwards would miss
    // every match older than the newest 100 records.
    const owner = toInteger(context, ownerId, 'Owner');
    if (owner !== undefined) {
        if (!config.ownerColumn) {
            throw cancelError(context, config.label + ' records have no owner to filter by.');
        }
        filters.push(config.ownerColumn + ' eq ' + owner);
    }
    if (filter) {
        filters.push(filter);
    }
    const { rows } = await archiveRows(context, object, {
        filters,
        orderBy: ENTITIES[object].primaryKey + ' desc',
        top: RECORD_PAGE_SIZE
    });
    return getRecords(context, object, rows.map(row => row.id));
};

const compareUpdated = (a, b) => {

    const left = Date.parse(a);
    const right = Date.parse(b);
    if (!isNaN(left) && !isNaN(right)) {
        return left - right;
    }
    return String(a).localeCompare(String(b));
};

/**
 * The most recently updated records of an object: [{ id, updated }], newest first.
 * @param {object} context
 * @param {string} object
 * @param {number} top
 * @returns {Promise<{rows: Array<{id: number, updated: string}>, truncated: boolean}>}
 */
const latestUpdates = async (context, object, top = UPDATED_PAGE_SIZE) => {

    const { updatedColumn } = getRecordObject(context, object);
    const { rows, truncated } = await archiveRows(context, object, {
        columns: [updatedColumn],
        orderBy: updatedColumn + ' desc,' + ENTITIES[object].primaryKey + ' desc',
        top
    });
    const key = updatedColumn.replace(/\//g, '__');
    return {
        rows: rows
            .map(({ id, row }) => ({ id, updated: rowString(row[key]) }))
            .filter(row => row.updated !== undefined),
        truncated
    };
};

const CONDITION_OPERATORS = ['changedTo', 'equals', 'notEquals', 'changed'];

const conditionText = (value) => {

    if (value === undefined || value === null) {
        return '';
    }
    return (typeof value === 'object' ? JSON.stringify(value) : String(value)).trim().toLowerCase();
};

/**
 * Whether an updated record passes the trigger's condition.
 * @param {object} condition { field, operator, value }
 * @param {object} record
 * @param {string|undefined} previous the field value when the trigger last saw the record
 * @returns {boolean}
 */
const matchesCondition = ({ field, operator, value }, record, previous) => {

    if (!field) {
        return true;
    }
    const current = conditionText(record[field]);
    const expected = conditionText(value);
    switch (operator) {
        case 'equals':
            return current === expected;
        case 'notEquals':
            return current !== expected;
        case 'changed':
            // Unknown earlier value: the trigger has not seen this record since it started.
            return previous !== undefined && previous !== current;
        case 'changedTo':
        default:
            return current === expected && previous !== current;
    }
};

/**
 * Shared tick() of Record Updated. Every tick reads the most recently updated records (newest
 * first) and compares their updated date with the one recorded last time: a record whose date
 * moved fired once for that date. The first tick only records. Records pulled onto a full page
 * because newer ones went away are not updates: they are not newer than the oldest date read
 * (the floor). An empty answer while records are known keeps the state.
 * @param {object} context
 */
const pollUpdatedRecords = async (context) => {

    const { object, conditionField, conditionOperator, conditionValue } = context.properties;
    getRecordObject(context, object);
    const condition = {
        field: conditionField,
        operator: CONDITION_OPERATORS.includes(conditionOperator) ? conditionOperator : 'changedTo',
        value: conditionValue
    };

    const state = (await context.loadState()) || {};
    const seen = state.seen && typeof state.seen === 'object' ? state.seen : null;
    const values = state.values && typeof state.values === 'object' ? { ...state.values } : {};
    const { floor } = state;
    const { rows, truncated } = await latestUpdates(context, object);

    if (seen && Object.keys(seen).length && !rows.length) {
        return;
    }

    if (seen) {
        const changed = rows
            .filter(row => seen[row.id] !== row.updated && (!floor || compareUpdated(row.updated, floor) > 0))
            // Oldest first, so that downstream steps see the changes in order.
            .reverse();
        for (const row of changed) {
            const entity = await getEntityOrNull(context, object, row.id);
            if (!entity) {
                continue;
            }
            const record = toRecord(object, entity, context);
            const previous = values[row.id];
            if (condition.field) {
                delete values[row.id];
                values[row.id] = conditionText(record[condition.field]);
            }
            if (matchesCondition(condition, record, previous)) {
                await context.sendJson(record, 'out');
            }
        }
    }

    const keys = Object.keys(values);
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_CONDITION_VALUES))) {
        delete values[key];
    }
    const oldest = rows[rows.length - 1];
    await context.saveState({
        seen: rows.reduce((res, row) => {
            res[row.id] = row.updated;
            return res;
        }, {}),
        floor: oldest && truncated ? oldest.updated : null,
        values
    });
};

// Fields of the generic components ---------------------------------------------------------

const listSource = (listName) => ({
    url: '/component/appmixer/superoffice/core/ListListItems?outPort=out',
    data: { properties: { isSource: true, listName }, transform: './ListListItems#toSelectArray' }
});

const USERS_SOURCE = {
    url: '/component/appmixer/superoffice/core/ListUsers?outPort=out',
    data: { properties: { isSource: true }, transform: './ListUsers#toSelectArray' }
};

// List Statuses requires the object on its in port: sent as a property only, the engine rejects the
// call before the component runs and the dropdown stays empty.
const statusSource = (object) => ({
    url: '/component/appmixer/superoffice/core/ListStatuses?outPort=out',
    data: {
        messages: { 'in/object': object, 'in/outputType': 'array' },
        properties: { isSource: true },
        transform: './ListStatuses#toSelectArray'
    }
});

const SALE_STATUSES = ['Open', 'Sold', 'Lost', 'Stalled'];
const APPOINTMENT_STATES = ['NotStarted', 'Started', 'Completed'];

// Standard fields Update Record offers per object; the keys are those ENTITIES[object].apply reads.
const STANDARD_FIELDS = {
    company: [
        { key: 'name', label: 'Name' },
        { key: 'department', label: 'Department' },
        { key: 'orgNr', label: 'Organization Number' },
        { key: 'categoryId', label: 'Category', source: listSource('Category') },
        { key: 'businessId', label: 'Business', source: listSource('Business') },
        { key: 'countryId', label: 'Country', source: listSource('Country') },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'website', label: 'Website' },
        { key: 'description', label: 'Description', type: 'textarea' }
    ],
    person: [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'title', label: 'Title' },
        { key: 'positionId', label: 'Position', source: listSource('Position') },
        { key: 'companyId', label: 'Company ID' },
        { key: 'email', label: 'Email' },
        { key: 'mobilePhone', label: 'Mobile Phone' },
        { key: 'officePhone', label: 'Office Phone' }
    ],
    sale: [
        { key: 'heading', label: 'Heading' },
        { key: 'status', label: 'Status', options: SALE_STATUSES },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'saleDate', label: 'Sale Date', type: 'date-time' },
        { key: 'probability', label: 'Probability', type: 'number' },
        { key: 'saleTypeId', label: 'Sale Type', source: listSource('SaleType') },
        { key: 'companyId', label: 'Company ID' },
        { key: 'personId', label: 'Person ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'description', label: 'Description', type: 'textarea' }
    ],
    project: [
        { key: 'name', label: 'Name' },
        { key: 'projectStatusId', label: 'Project Status', source: listSource('ProjectStatus') },
        { key: 'projectTypeId', label: 'Project Type', source: listSource('ProjectType') },
        { key: 'startDate', label: 'Start Date', type: 'date-time' },
        { key: 'endDate', label: 'End Date', type: 'date-time' },
        { key: 'description', label: 'Description', type: 'textarea' }
    ],
    appointment: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'completed', label: 'Completed', options: APPOINTMENT_STATES },
        { key: 'startDate', label: 'Start Date', type: 'date-time' },
        { key: 'endDate', label: 'End Date', type: 'date-time' },
        { key: 'taskId', label: 'Task', source: listSource('Task') },
        { key: 'location', label: 'Location' },
        { key: 'companyId', label: 'Company ID' },
        { key: 'personId', label: 'Person ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'saleId', label: 'Sale ID' }
    ],
    ticket: [
        { key: 'title', label: 'Title' },
        { key: 'statusId', label: 'Status', source: statusSource('ticket') },
        { key: 'categoryId', label: 'Category ID' },
        { key: 'deadline', label: 'Deadline', type: 'date-time' },
        { key: 'personId', label: 'Person ID' }
    ]
};

const OWNER_FIELD = { key: 'ownerId', label: 'Owner', source: USERS_SOURCE };

const standardFields = (object) => (STANDARD_FIELDS[object] || []).concat(OWNER_FIELD);

const jsonTypeOf = (fieldType) => {

    if (['Integer', 'MdoList', 'RelationTo', 'Attachment', 'TimeSpan', 'Checkbox'].includes(fieldType)) {
        return 'integer';
    }
    return fieldType === 'Decimal' ? 'number' : 'string';
};

const CUSTOM_EXAMPLES = { integer: 4, number: 4.5, string: 'Promoter' };

/**
 * Output properties of a record of the object: its fixed fields plus one cf_* property per
 * custom field. Used for the variable picker of Get Record, Find Records and Record Updated.
 * @param {string} object
 * @param {object[]} [infos] customFieldInfos()
 * @returns {object}
 */
const recordProperties = (object, infos = []) => {

    const base = RECORD_ITEM_SCHEMA.properties;
    const properties = {
        object: base.object,
        ...(ITEM_SCHEMAS[object] ? ITEM_SCHEMAS[object].properties : { id: base.id }),
        ownerId: base.ownerId,
        ownerName: base.ownerName
    };
    if (object === 'appointment') {
        properties.ticketId = { type: 'integer', title: 'Ticket ID', example: 4021 };
    }
    properties.customFields = base.customFields;
    for (const info of infos) {
        const type = jsonTypeOf(info.fieldType);
        properties[info.key] = { type, title: info.label, example: CUSTOM_EXAMPLES[type] };
    }
    return properties;
};

// The record contract common to every object (the variable picker adds the object's own fields).
const RECORD_ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'object'],
    properties: {
        id: { type: 'integer', title: 'Record ID', example: 4021 },
        object: { type: 'string', title: 'Object', example: 'ticket' },
        ownerId: { type: 'integer', title: 'Owner ID', example: 5 },
        ownerName: { type: 'string', title: 'Owner Name', example: 'Anna Berg' },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-18T14:05:00Z' },
        customFields: {
            type: 'object',
            title: 'Custom Fields',
            example: { 'SuperOffice:1': 'Promoter', 'x_nps_score': 9 }
        }
    }
};

/**
 * recordProperties() with the tenant's custom fields when they can be read; the designer
 * calls this while the account may still be missing, so failures fall back to fixed fields.
 * @param {object} context
 * @param {string} object
 * @returns {Promise<object>}
 */
const recordPropertiesFor = async (context, object) => {

    if (!RECORD_OBJECTS[object]) {
        return RECORD_ITEM_SCHEMA.properties;
    }
    let infos = [];
    try {
        infos = await customFieldInfosCached(context, object);
    } catch (err) {
        infos = [];
    }
    return recordProperties(object, infos);
};

/**
 * The output port options of a single record (Get Record, Record Updated).
 * @param {object} properties recordProperties()
 * @returns {object[]}
 */
const toOutputOptions = (properties) => {

    return Object.keys(properties).map(key => {
        const { title, ...schema } = properties[key];
        return { label: title, value: key, schema };
    });
};

const inspectorInput = (field, index) => {

    const input = { type: field.type || 'text', index, label: field.label };
    if (field.options) {
        input.type = 'select';
        input.options = field.options.map(value => ({ label: value.replace(/([a-z])([A-Z])/g, '$1 $2'), value }));
    }
    if (field.source) {
        input.source = field.source;
        input.tooltip = 'Pick a value, or type its ID.';
    }
    return input;
};

/**
 * The inspector of Update Record for an object: object, record ID, the standard fields, the
 * writable custom fields of the tenant and a JSON input for custom fields by name.
 * @param {object} context
 * @param {string} object
 * @returns {Promise<object>}
 */
const updateRecordInspector = async (context, object) => {

    const schema = {
        type: 'object',
        properties: {
            object: { type: 'string', enum: Object.keys(RECORD_OBJECTS) },
            recordId: { type: 'string' }
        },
        required: ['object', 'recordId']
    };
    const inputs = {
        object: {
            type: 'select',
            index: 1,
            label: 'Object',
            tooltip: 'The kind of record to update.',
            options: OBJECT_OPTIONS
        },
        recordId: {
            type: 'text',
            index: 2,
            label: 'Record ID',
            tooltip: 'The ID of the record, for example from Record Updated or Find Records.'
        }
    };
    let index = 3;
    if (RECORD_OBJECTS[object]) {
        for (const field of standardFields(object)) {
            schema.properties[field.key] = { type: field.type === 'number' ? 'number' : 'string' };
            inputs[field.key] = inspectorInput(field, index++);
        }
        let infos = [];
        try {
            infos = await customFieldInfosCached(context, object);
        } catch (err) {
            infos = [];
        }
        for (const info of infos.filter(item => !item.readOnly)) {
            const type = jsonTypeOf(info.fieldType);
            schema.properties[info.key] = { type: type === 'string' ? 'string' : 'number' };
            const input = { type: 'text', index: index++, label: info.label, tooltip: 'Custom field ' + info.fieldName + ' (' + info.fieldType + ').' };
            if (info.fieldType === 'Date' || info.fieldType === 'DateTime') {
                input.type = 'date-time';
            } else if (info.fieldType === 'Checkbox') {
                input.type = 'toggle';
                schema.properties[info.key] = { type: 'boolean' };
            } else if (info.fieldType === 'LongText') {
                input.type = 'textarea';
            } else if (type !== 'string') {
                input.type = 'number';
            }
            inputs[info.key] = input;
        }
    }
    schema.properties.customFieldsJson = { type: 'string' };
    inputs.customFieldsJson = {
        type: 'textarea',
        index,
        label: 'Custom Fields (JSON)',
        tooltip: 'Optional custom field values by field name, for example <code>{"SuperOffice:1": "Promoter", "x_nps_score": 9}</code>. Use it when the object comes from a variable and the fields above cannot be listed.'
    };
    schema.properties.timeZone = { type: 'string' };
    inputs.timeZone = { ...TIME_ZONE_INPUT, index: index + 1 };
    return { schema, inputs };
};

/**
 * Update Record: standard fields are applied to the stored entity and saved with PUT; custom
 * fields are written with PATCH on CustomFields (JSON Patch, as documented for user-defined fields).
 * @param {object} context
 * @param {string} object
 * @param {*} id
 * @param {object} input component inputs
 * @returns {Promise<void>}
 */
const updateRecord = async (context, object, id, input) => {

    getRecordObject(context, object);
    const standard = {};
    for (const field of standardFields(object)) {
        if (!isEmpty(input[field.key])) {
            standard[field.key] = input[field.key];
        }
    }
    const customByKey = {};
    for (const [key, value] of Object.entries(input)) {
        if (key.startsWith(CUSTOM_FIELD_PREFIX) && !isEmpty(value)) {
            customByKey[key] = value;
        }
    }
    const customByName = parseJsonInput(context, input.customFieldsJson, 'Custom Fields (JSON)') || {};
    if (typeof customByName !== 'object' || Array.isArray(customByName)) {
        throw cancelError(context, 'Custom Fields (JSON) must be a JSON object.');
    }

    if (!Object.keys(standard).length && !Object.keys(customByKey).length && !Object.keys(customByName).length) {
        throw cancelError(context, 'Set at least one field to update.');
    }

    const path = entityPath(context, object, id);

    if (Object.keys(standard).length) {
        const current = await request(context, { path });
        const entity = ENTITIES[object].apply(context, current, standard);
        const ownerId = toInteger(context, standard.ownerId, 'Owner');
        if (ownerId !== undefined) {
            entity[object === 'ticket' ? 'OwnedBy' : 'Associate'] = { AssociateId: ownerId };
        }
        await request(context, { method: 'PUT', path, data: entity });
    }

    if (Object.keys(customByKey).length || Object.keys(customByName).length) {
        const infos = await customFieldInfos(context, object);
        const byKey = new Map(infos.map(info => [info.key, info]));
        const byName = new Map(infos.map(info => [info.fieldName, info]));
        const values = {};
        for (const [key, value] of Object.entries(customByKey)) {
            const info = byKey.get(key);
            if (!info) {
                throw cancelError(context, 'Unknown custom field ' + key + ' on ' + RECORD_OBJECTS[object].label + '.');
            }
            values[info.fieldName] = encodeCustomValue(context, value, info.fieldType, info.label);
        }
        for (const [name, value] of Object.entries(customByName)) {
            const info = byName.get(name);
            values[name] = info
                ? encodeCustomValue(context, value, info.fieldType, info.label)
                : encodeCustomValue(context, value, 'Unknown', name);
        }
        await request(context, {
            method: 'PATCH',
            path,
            data: [{ op: 'replace', path: 'CustomFields', value: values }]
        });
    }
};

/**
 * Create a follow-up (appointment) as a task or as a completed activity, assigned to a user and
 * linked to a company, person, project, sale and/or ticket (appointment.ticket_id).
 * @param {object} context
 * @param {object} input
 * @param {object} [defaults] values forced by the component (type, completed)
 * @returns {Promise<object>} the created record
 */
const createActivity = async (context, input, defaults = {}) => {

    const template = await request(context, { path: '/Appointment/default' });
    const entity = ENTITIES.appointment.apply(context, template || {}, { ...input, ...defaults });
    const assigneeId = toInteger(context, input.assigneeId, 'Assigned To');
    if (assigneeId !== undefined) {
        entity.Associate = { AssociateId: assigneeId };
    }
    const ticketId = toInteger(context, input.ticketId, 'Ticket ID');
    if (ticketId !== undefined) {
        entity.Ticket = { TicketId: ticketId };
    }
    const created = await request(context, { method: 'POST', path: '/Appointment', data: entity });
    return toRecord('appointment', created, context);
};

/**
 * Items of an MDO list (GET /MDOList/{name}?flat=true), headings and deleted items left out.
 * @param {object} context
 * @param {string} name e.g. associate
 * @returns {Promise<object[]>}
 */
const mdoListItems = async (context, name) => {

    const body = await request(context, { path: '/MDOList/' + encodeURIComponent(name), params: { flat: true } });
    return flattenListItems(Array.isArray(body) ? body : []);
};

/**
 * Status values of an object, for conditions and updates: ticket statuses, project statuses,
 * the sale status and the completed state of a follow-up. Companies and persons have none.
 * @param {object} context
 * @param {string} object
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
const statusValues = async (context, object) => {

    getRecordObject(context, object);
    if (object === 'ticket') {
        // The ticket statuses of the tenant (Open, Closed, Postponed, ...). The MDO list "ticketstatus"
        // holds the base statuses under other IDs, so its IDs must not be written to a ticket.
        const body = await request(context, { path: '/List/TicketStatus/Items' });
        return (Array.isArray(body) ? body : [])
            .filter(item => item && typeof item.TicketStatusId === 'number' && item.TicketStatusId > 0)
            .map(item => ({ id: String(item.TicketStatusId), name: item.Name }));
    }
    if (object === 'project') {
        return (await listItems(context, 'ProjectStatus')).map(item => ({ id: String(item.id), name: item.name }));
    }
    if (object === 'sale') {
        return SALE_STATUSES.map(value => ({ id: value, name: value }));
    }
    if (object === 'appointment') {
        return APPOINTMENT_STATES.map(value => ({ id: value, name: value.replace(/([a-z])([A-Z])/g, '$1 $2') }));
    }
    return [];
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

    ENVIRONMENTS,
    CLAIM_PREFIX,
    PAGE_SIZE,
    TRIGGER_PAGE_SIZE,
    ITEM_SCHEMAS,
    ENTITIES,
    LIST_NAMES,

    getEnvironment,
    getLoginOrigin,
    decodeJwtClaims,
    tenantFromIdToken,
    getTenantId,
    toApiBase,
    getApiBase,
    authHeaders,
    sendWithTenant,
    request,
    toInteger,
    toNumber,
    toIsoDate,
    getTimeZone,
    listTimeZones,
    timeZoneForBias,
    toUtc,
    quote,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    findItems,
    newestItems,
    pollNewItems,
    listItems,
    callCached,
    resolveApiUrl,
    kvToObject,
    parseJsonInput,
    toCsv,

    RECORD_OBJECTS,
    OBJECT_OPTIONS,
    RECORD_PAGE_SIZE,
    UPDATED_PAGE_SIZE,
    RECORD_ITEM_SCHEMA,
    CONDITION_OPERATORS,
    customFieldKey,
    decodeCustomValue,
    encodeCustomValue,
    customFieldsOf,
    customFieldInfos,
    customFieldInfosCached,
    toRecord,
    getRecord,
    findRecords,
    latestUpdates,
    matchesCondition,
    pollUpdatedRecords,
    standardFields,
    recordProperties,
    recordPropertiesFor,
    toOutputOptions,
    updateRecordInspector,
    updateRecord,
    createActivity,
    mdoListItems,
    statusValues,

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
