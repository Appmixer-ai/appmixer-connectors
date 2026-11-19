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
const request = async (context, { method = 'GET', path, params, data }) => {

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
 * Turn a date input into an ISO 8601 UTC string.
 * @param {object} context
 * @param {*} value
 * @param {string} label
 * @returns {string|undefined}
 */
const toIsoDate = (context, value, label) => {

    if (isEmpty(value)) {
        return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw cancelError(context, label + ' is not a valid date.');
    }
    return date.toISOString();
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
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00' }
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
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00' }
        }
    },

    sale: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', title: 'Sale ID', example: 57 },
            heading: { type: 'string', title: 'Heading', example: '50 licences' },
            amount: { type: 'number', title: 'Amount', example: 12500 },
            saleDate: { type: 'string', title: 'Sale Date', example: '2026-12-15T00:00:00' },
            status: { type: 'string', title: 'Status', example: 'Open' },
            probability: { type: 'integer', title: 'Probability', example: 50 },
            saleType: { type: 'string', title: 'Sale Type', example: 'New business' },
            companyId: { type: 'integer', title: 'Company ID', example: 125 },
            companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
            personId: { type: 'integer', title: 'Person ID', example: 342 },
            personName: { type: 'string', title: 'Person Name', example: 'Jane Doe' },
            projectId: { type: 'integer', title: 'Project ID', example: 12 },
            description: { type: 'string', title: 'Description', example: 'Renewal of the yearly licence.' },
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00' }
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
            startDate: { type: 'string', title: 'Start Date', example: '2026-11-16T00:00:00' },
            endDate: { type: 'string', title: 'End Date', example: '2027-02-28T00:00:00' },
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00' }
        }
    },

    appointment: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'integer', title: 'Follow-up ID', example: 981 },
            title: { type: 'string', title: 'Title', example: 'Kick-off meeting' },
            description: { type: 'string', title: 'Description', example: 'Agree on the project plan.' },
            startDate: { type: 'string', title: 'Start Date', example: '2026-11-20T09:00:00' },
            endDate: { type: 'string', title: 'End Date', example: '2026-11-20T10:00:00' },
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
            createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00' },
            updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00' }
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
            updatedDate: e.UpdatedDate
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
            updatedDate: e.UpdatedDate
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
            updatedDate: e.UpdatedDate
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
            updatedDate: e.UpdatedDate
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
            updatedDate: e.UpdatedDate
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
    return entityConfig(type).fromEntity(entity);
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
    return config.fromEntity(created);
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
        const item = config.fromRow(row || {});
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
