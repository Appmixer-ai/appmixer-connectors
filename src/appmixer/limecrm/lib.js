/* eslint-disable no-underscore-dangle */
// Lime CRM's HAL responses and query parameters use underscore names (_embedded, _limit, _sort).
'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const DEFAULT_PREFIX = 'limecrm-objects-export';

// Maximum page size of the Limeobject API collection endpoints (_limit 1-50).
const MAX_PAGE_SIZE = 50;

// Limetype, property and relation names are identifiers of the customer's data model.
// They become path segments, so anything else is refused before a request is made.
const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ID_PATTERN = /^[0-9]+$/;

// Webhook signatures v2 carry a timestamp; deliveries older than this are refused.
const SIGNATURE_WINDOW_SECONDS = 300;

// Property types that hold no writable value of their own.
const READONLY_TYPES = ['hasmany', 'hasandbelongstomany', 'system'];
const INTEGER_TYPES = ['integer', 'year', 'timespan'];
const DECIMAL_TYPES = ['decimal', 'percent', 'float', 'number'];
const DATE_TYPES = ['date', 'time', 'datetime', 'month', 'quarter'];
const BOOLEAN_TYPES = ['yesno', 'boolean'];
const RELATION_TYPES = ['belongsto', 'hasone', 'file'];
const LONG_TEXT_TYPES = ['text', 'xml'];

// Inputs of the Create/Update inspectors that are not object properties.
const STATIC_INPUTS = ['values', 'objectId'];

/**
 * Parse the Server URL of the connected account and return the application base URL
 * (origin + application path), e.g. https://acme.lime-crm.com/acme.
 * The URL is typed by the user and the API key is sent to it: only https, no
 * credentials, no query or fragment. A trailing slash and an /api/v1 suffix are
 * dropped. Every request of the connector builds its URL through this function.
 * @param {string} serverUrl
 * @returns {{ origin: string, path: string, base: string }}
 */
function applicationUrl(serverUrl) {

    if (typeof serverUrl !== 'string' || !serverUrl.trim()) {
        throw new Error('Server URL is required, e.g. https://acme.lime-crm.com/acme.');
    }
    let parsed;
    try {
        parsed = new URL(serverUrl.trim());
    } catch (err) {
        throw new Error('Server URL is not a valid URL. Enter it like https://acme.lime-crm.com/acme.');
    }
    if (parsed.protocol !== 'https:') {
        throw new Error('Server URL must start with https://.');
    }
    if (parsed.username || parsed.password) {
        throw new Error('Server URL must not contain a user name or password.');
    }
    if (parsed.search || parsed.hash) {
        throw new Error('Server URL must not contain a query string or a fragment.');
    }
    const path = parsed.pathname.replace(/\/+$/, '').replace(/\/api\/v[0-9]+$/i, '');
    return { origin: parsed.origin, path, base: parsed.origin + path };
}

/**
 * Headers carrying the credential. The one place that turns an account into headers.
 * @param {string} apiKey
 * @returns {object}
 */
function authHeaders(apiKey) {

    return {
        'x-api-key': apiKey,
        'Accept': 'application/hal+json, application/json'
    };
}

/**
 * Append query parameters; array values become repeated keys (?a=1&a=2), the format
 * the Lime CRM API uses for _embed and for OR filters.
 * @param {string} url
 * @param {object} params
 * @returns {string}
 */
function withQuery(url, params) {

    if (!params) return url;
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
            search.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item));
        }
    }
    const query = search.toString();
    if (!query) return url;
    return url + (url.includes('?') ? '&' : '?') + query;
}

function statusOf(err) {

    return (err && err.response && err.response.status) || (err && err.status) || undefined;
}

function isNotFound(err) {

    return statusOf(err) === 404;
}

/**
 * Turn an HTTP error of the Lime CRM API into a readable one, keeping the status.
 * The API answers errors with {"error": "..."}; unauthorized calls may answer 404.
 */
function toApiError(err) {

    const status = statusOf(err);
    if (!status) return err;
    const body = err.response && err.response.data;
    let detail = '';
    if (body && typeof body === 'object') {
        detail = body.error || body.message || JSON.stringify(body);
    } else if (typeof body === 'string') {
        detail = body.slice(0, 500);
    } else if (Buffer.isBuffer(body)) {
        detail = body.toString('utf8').slice(0, 500);
    }
    let hint = '';
    if (status === 404) {
        hint = ' (not found, or the API user has no access to it)';
    } else if (status === 401 || status === 403) {
        hint = ' (the API key is invalid or the API user is not permitted to do this)';
    }
    const error = new Error('Lime CRM API error ' + status + hint + (detail ? ': ' + detail : ''));
    error.status = status;
    error.response = err.response;
    return error;
}

/**
 * Send a request to the application of the connected account.
 * @param {object} context
 * @param {object} options
 * @param {string} [options.method]
 * @param {string} options.path path below /api/<version>, e.g. /limeobject/company/
 * @param {object} [options.params]
 * @param {*} [options.data]
 * @param {object} [options.headers]
 * @param {string} [options.responseType]
 * @param {string} [options.apiVersion] v1 by default
 * @returns {Promise<object>} the full response ({ status, headers, data })
 */
async function request(context, { method = 'GET', path, params, data, headers = {}, responseType, apiVersion = 'v1' }) {

    const { base } = applicationUrl(context.auth.serverUrl);
    const options = {
        method,
        url: withQuery(base + '/api/' + apiVersion + path, params),
        headers: { ...headers, ...authHeaders(context.auth.apiKey) }
    };
    if (data !== undefined) options.data = data;
    if (responseType) options.responseType = responseType;
    try {
        return await context.httpRequest(options);
    } catch (err) {
        throw toApiError(err);
    }
}

async function apiCall(context, options) {

    const { data } = await request(context, options);
    return data;
}

function getCacheKey(obj) {

    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

/**
 * GET with a short-lived cache shared by the designer's dropdowns and inspectors,
 * which fire in bursts. The key covers the application, the API key and the request.
 */
async function apiGetCached(context, path, params) {

    const key = 'limecrm-' + getCacheKey({
        base: applicationUrl(context.auth.serverUrl).base,
        apiKey: context.auth.apiKey,
        path,
        params
    });
    let lock;
    try {
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) return cached;
        const data = await apiCall(context, { path, params });
        await context.staticCache.set(key, data, context.config.listCacheTTL || (2 * 60 * 1000));
        return data;
    } finally {
        lock && await lock.unlock();
    }
}

/**
 * A limetype, property or relation name for a URL path segment.
 */
function assertName(context, value, label) {

    const name = typeof value === 'string' ? value.trim() : value;
    if (!name) {
        throw new context.CancelError(label + ' is required!');
    }
    if (typeof name !== 'string' || !NAME_PATTERN.test(name)) {
        throw new context.CancelError(label + ' must be the API name of a Lime CRM ' + label.toLowerCase() + ', e.g. company.');
    }
    return name;
}

/**
 * An object or file id (integer) for a URL path segment.
 */
function assertId(context, value, label) {

    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(label + ' is required!');
    }
    const id = String(value).trim();
    if (!ID_PATTERN.test(id)) {
        throw new context.CancelError(label + ' must be a number.');
    }
    return id;
}

/**
 * The items of a collection response. The Limeobject API answers in HAL: the items
 * sit in an array under _embedded (key name depends on the endpoint); a plain array
 * and the Query API's {objects: [...]} are accepted too.
 * @param {*} data
 * @returns {Array}
 */
function extractItems(data) {

    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    if (Array.isArray(data.objects)) return data.objects;
    const embedded = data._embedded;
    if (embedded && typeof embedded === 'object') {
        for (const value of Object.values(embedded)) {
            if (Array.isArray(value)) return value;
        }
    }
    if (Array.isArray(data.items)) return data.items;
    return [];
}

/**
 * A single object response (a belongsto relation) instead of a collection.
 */
function isSingleObject(data) {

    return !!data && typeof data === 'object' && !Array.isArray(data)
        && extractItems(data).length === 0
        && (data.id !== undefined || data._id !== undefined);
}

/**
 * A limeobject as the components emit it: the API's properties without the HAL links.
 */
function mapObject(object) {

    if (!object || typeof object !== 'object') return object;
    const rest = { ...object };
    delete rest._links;
    if (rest.id === undefined && rest._id !== undefined) {
        rest.id = rest._id;
    }
    return rest;
}

function mapFile(file) {

    if (!file || typeof file !== 'object') return file;
    const rest = { ...file };
    delete rest._links;
    return rest;
}

function localText(value) {

    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        if (typeof value.singular === 'string') return value.singular;
        if (typeof value.text === 'string') return value.text;
        const first = Object.values(value).find(item => typeof item === 'string' && item);
        if (first) return first;
    }
    return undefined;
}

function mapLimetype(limetype, fallbackName) {

    const localname = limetype.localname;
    const name = limetype.name || limetype._name || fallbackName;
    return {
        name,
        label: typeof limetype.label === 'string' ? limetype.label : null,
        localNameSingular: localText(localname) || name,
        localNamePlural: (localname && typeof localname === 'object' && localname.plural) || localText(localname) || name
    };
}

/**
 * All limetypes the API user can see.
 */
async function listLimetypes(context, { cached = false } = {}) {

    const params = { _embed: 'limetypes' };
    const data = cached
        ? await apiGetCached(context, '/limetype/', params)
        : await apiCall(context, { path: '/limetype/', params });
    let items = extractItems(data);
    if (!items.length && data && typeof data === 'object' && !Array.isArray(data)) {
        // Without embedded limetypes HAL lists them as links: {href, name?}.
        const links = data._links && data._links.limetypes;
        if (Array.isArray(links)) {
            items = links.map(link => ({
                name: link.name || (String(link.href || '').replace(/\/+$/, '').split('/').pop())
            }));
        }
    }
    return items
        .filter(item => item && typeof item === 'object')
        .map(item => mapLimetype(item))
        .filter(item => item.name);
}

function normalizeOptions(raw) {

    if (!Array.isArray(raw)) return [];
    return raw
        .filter(option => option && typeof option === 'object')
        .map(option => {
            const key = option.key !== undefined ? option.key : option.value;
            return { key, text: localText(option.localname) || option.text || option.label || String(key) };
        })
        .filter(option => option.key !== undefined && option.key !== null && option.key !== '');
}

/**
 * The property definitions of a limetype, in one shape. The Limetype API embeds them
 * with _embed=properties; an array or a map keyed by property name are both accepted.
 * @param {object} limetype
 * @returns {Array<{name, type, label, required, readonly, options}>}
 */
function normalizeProperties(limetype) {

    if (!limetype || typeof limetype !== 'object') return [];
    const raw = limetype.properties || (limetype._embedded && limetype._embedded.properties) || [];
    const list = Array.isArray(raw)
        ? raw
        : Object.entries(raw).map(([name, value]) => ({ name, ...(value && typeof value === 'object' ? value : {}) }));
    return list
        .filter(property => property && typeof property === 'object' && typeof property.name === 'string' && property.name)
        .map(property => {
            const type = String(property.type || 'string').toLowerCase();
            return {
                name: property.name,
                type,
                label: localText(property.localname) || property.title || property.name,
                required: property.required === true,
                readonly: property.readonly === true || property.name.startsWith('_') || READONLY_TYPES.includes(type),
                options: normalizeOptions(property.options || property.option_items
                    || (property._embedded && property._embedded.options))
            };
        });
}

/**
 * One limetype with its property definitions.
 */
async function getLimetype(context, limetype, { cached = false } = {}) {

    const path = '/limetype/' + encodeURIComponent(limetype) + '/';
    const params = { _embed: 'properties' };
    const data = cached ? await apiGetCached(context, path, params) : await apiCall(context, { path, params });
    return {
        ...mapLimetype(data || {}, limetype),
        properties: normalizeProperties(data)
    };
}

/**
 * Property definitions for building inspectors and output schemas. Never throws:
 * without a limetype or when the Limetype API fails the result is empty.
 */
async function getPropertiesSafe(context, limetype) {

    if (!limetype || !NAME_PATTERN.test(String(limetype))) return [];
    try {
        const { properties } = await getLimetype(context, limetype, { cached: true });
        return properties;
    } catch (err) {
        await context.log({ step: 'Could not load the limetype properties.', limetype, error: err.message });
        return [];
    }
}

function writableProperties(properties) {

    return properties.filter(property => !property.readonly && !STATIC_INPUTS.includes(property.name));
}

/**
 * Inspector inputs for the writable properties of a limetype (Create/Update Object).
 * @param {Array} properties normalized properties
 * @param {object} base { schema: {properties}, inputs, groups } of the static inputs
 * @param {object} [options]
 * @param {boolean} [options.update] Update Object: empty inputs leave the property as it is
 * @returns {{ schema: object, inputs: object, groups: object }}
 */
function toInspector(properties, base, { update = false } = {}) {

    const schema = {
        type: 'object',
        properties: { ...(base.schema && base.schema.properties) },
        required: [...((base.schema && base.schema.required) || [])]
    };
    const inputs = { ...base.inputs };
    const groups = {
        ...base.groups,
        properties: { label: 'Properties', index: 2 }
    };

    let index = Object.keys(inputs).length + 1;
    for (const property of writableProperties(properties)) {
        const tooltipParts = [property.name + ' (' + property.type + ')'];
        if (property.required) tooltipParts.push('Required in Lime CRM.');
        if (update) tooltipParts.push('Leave empty to keep the current value.');
        let input;
        let propertySchema;
        if (property.type === 'option' && property.options.length) {
            input = { type: 'select', options: property.options.map(option => ({ label: option.text, value: String(option.key) })) };
            propertySchema = { type: 'string' };
        } else if (property.type === 'set') {
            input = property.options.length
                ? { type: 'multiselect', options: property.options.map(option => ({ label: option.text, value: String(option.key) })) }
                : { type: 'multiselect', options: [] };
            propertySchema = { type: ['array', 'string'] };
        } else if (BOOLEAN_TYPES.includes(property.type)) {
            input = { type: 'select', options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] };
            propertySchema = { type: 'string' };
        } else if (INTEGER_TYPES.includes(property.type)) {
            input = { type: 'number' };
            propertySchema = { type: 'integer' };
        } else if (DECIMAL_TYPES.includes(property.type)) {
            input = { type: 'number' };
            propertySchema = { type: 'number' };
        } else if (RELATION_TYPES.includes(property.type)) {
            input = { type: 'number' };
            propertySchema = { type: 'integer' };
            tooltipParts.push(property.type === 'file'
                ? 'The ID of a file uploaded with Upload File.'
                : 'The ID of the related object.');
        } else if (DATE_TYPES.includes(property.type)) {
            input = { type: 'date-time' };
            propertySchema = { type: 'string', format: 'date-time' };
        } else {
            input = { type: LONG_TEXT_TYPES.includes(property.type) ? 'textarea' : 'text' };
            propertySchema = { type: 'string' };
        }
        inputs[property.name] = {
            ...input,
            label: property.label,
            tooltip: tooltipParts.join(' '),
            index: index++,
            group: 'properties'
        };
        schema.properties[property.name] = propertySchema;
    }

    return { schema, inputs, groups };
}

/**
 * Parse a JSON textarea input. Empty means undefined; an object passes through.
 */
function parseJsonInput(context, value, label) {

    if (value === null || value === undefined || value === '') {
        return undefined;
    }
    if (typeof value === 'object') {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        throw new context.CancelError(label + ' must be valid JSON.');
    }
}

function parseJsonObject(context, value, label) {

    const parsed = parseJsonInput(context, value, label);
    if (parsed === undefined) return undefined;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new context.CancelError(label + ' must be a JSON object.');
    }
    return parsed;
}

/**
 * Normalize multiselect input (array or string) to an array.
 * Strings are treated as single values or comma-separated lists.
 */
function normalizeMultiselectInput(input, context, fieldName) {

    if (Array.isArray(input)) {
        return input;
    } else if (typeof input === 'string') {
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else {
        throw new context.CancelError(fieldName + ' must be a string or an array');
    }
}

function coerceValue(context, property, value) {

    if (!property) return value;
    if (BOOLEAN_TYPES.includes(property.type)) {
        if (typeof value === 'boolean') return value;
        const text = String(value).trim().toLowerCase();
        if (['true', 'yes', '1'].includes(text)) return true;
        if (['false', 'no', '0'].includes(text)) return false;
        throw new context.CancelError(property.label + ' must be Yes or No.');
    }
    if (INTEGER_TYPES.includes(property.type) || RELATION_TYPES.includes(property.type)) {
        const number = Number(value);
        if (!Number.isInteger(number)) {
            throw new context.CancelError(property.label + ' must be a whole number.');
        }
        return number;
    }
    if (DECIMAL_TYPES.includes(property.type)) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            throw new context.CancelError(property.label + ' must be a number.');
        }
        return number;
    }
    if (property.type === 'set') {
        return normalizeMultiselectInput(value, context, property.label);
    }
    return value;
}

/**
 * The property values to send: the JSON object of the Values input, overridden by
 * every filled property input. Empty inputs are not sent (an Update leaves them as
 * they are; use the Values JSON with null to clear a property).
 * @param {object} context
 * @param {object} content the input message
 * @param {Array} properties normalized properties (may be empty)
 * @returns {object}
 */
function buildValues(context, content, properties) {

    const values = { ...(parseJsonObject(context, content.values, 'Values') || {}) };
    const byName = new Map(properties.map(property => [property.name, property]));
    for (const [key, value] of Object.entries(content)) {
        if (STATIC_INPUTS.includes(key)) continue;
        if (value === undefined || value === null || value === '') continue;
        if (Array.isArray(value) && value.length === 0) continue;
        values[key] = coerceValue(context, byName.get(key), value);
    }
    return values;
}

// The fields every limeobject carries, whatever the data model.
const OBJECT_ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'ID', example: 1001 },
        _createdtime: { type: 'string', format: 'date-time', title: 'Created Time', example: '2026-11-16T09:30:00+01:00' },
        _timestamp: { type: 'string', format: 'date-time', title: 'Updated Time', example: '2026-11-16T10:15:00+01:00' }
    }
};

/**
 * Output schema properties of a limeobject: the system fields plus one per property.
 * Option properties are read as {id, key, text}.
 */
function objectSchemaProperties(properties) {

    const result = { ...OBJECT_ITEM_SCHEMA.properties };
    for (const property of properties) {
        if (result[property.name] || ['hasmany', 'hasandbelongstomany'].includes(property.type)) continue;
        const title = property.label;
        let schema;
        if (property.type === 'option') {
            schema = {
                type: 'object',
                title,
                properties: {
                    id: { type: 'integer', title: title + '.ID' },
                    key: { type: 'string', title: title + '.Key' },
                    text: { type: 'string', title: title + '.Text' }
                }
            };
        } else if (property.type === 'set') {
            schema = { type: 'array', title };
        } else if (BOOLEAN_TYPES.includes(property.type)) {
            schema = { type: 'boolean', title };
        } else if (INTEGER_TYPES.includes(property.type) || RELATION_TYPES.includes(property.type)) {
            schema = { type: 'integer', title };
        } else if (DECIMAL_TYPES.includes(property.type)) {
            schema = { type: 'number', title };
        } else if (DATE_TYPES.includes(property.type)) {
            schema = { type: 'string', format: 'date-time', title };
        } else {
            schema = { type: 'string', title };
        }
        result[property.name] = schema;
    }
    return result;
}

/**
 * Variable picker options from a map of schema properties.
 */
function schemaToOptions(schemaProperties) {

    return Object.entries(schemaProperties).map(([value, schema]) => {
        const { title: label, ...rest } = schema;
        return { label: label || value, value, schema: rest };
    });
}

async function sendArrayOutput({ context, outputPortName = 'out', outputType = 'array', records = [] }) {

    if (outputType === 'first') {
        if (records.length === 0) {
            throw new context.CancelError('No records available for first output type');
        }
        await context.sendJson({ ...records[0], index: 0, count: records.length }, outputPortName);
    } else if (outputType === 'object') {
        for (let index = 0; index < records.length; index++) {
            await context.sendJson({ ...records[index], index, count: records.length }, outputPortName);
        }
    } else if (outputType === 'array') {
        await context.sendJson({ result: records, count: records.length }, outputPortName);
    } else if (outputType === 'file') {
        const csvString = toCsv(records);
        const buffer = Buffer.from(csvString, 'utf8');
        const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
        const fileName = (context.config.outputFilePrefix || DEFAULT_PREFIX) + '-' + componentName + '.csv';
        const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
        await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
        await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
    } else {
        throw new context.CancelError('Unsupported outputType ' + outputType);
    }
}

function getOutputPortOptions(context, outputType, itemSchema, { label, value }) {

    if (outputType === 'object' || outputType === 'first') {
        const options = Object.keys(itemSchema)
            .reduce((res, field) => {
                const schema = itemSchema[field];
                const { title, ...schemaWithoutTitle } = schema;
                res.push({ label: title || field, value: field, schema: schemaWithoutTitle });
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

// One CSV cell per RFC 4180: null/undefined -> empty, objects -> JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    if (!records.length) return '';
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

/**
 * Resolve a MakeApiCall endpoint against the application of the connected account and
 * refuse anything that would send the API key elsewhere. A relative path is taken
 * below /api/v1 (or below the application when it starts with /api/); a full URL must
 * point into the application. Resolution and comparison use the WHATWG URL parser.
 * @param {object} context
 * @param {string} url
 * @returns {string}
 */
function resolveApiUrl(context, url) {

    const app = applicationUrl(context.auth.serverUrl);
    const input = String(url).trim();
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(input) || input.startsWith('//');
    let candidate = input;
    if (!isAbsolute) {
        const path = input.startsWith('/') ? input : '/' + input;
        candidate = app.base + (/^\/api(\/|$)/i.test(path) ? path : '/api/v1' + path);
    }

    let parsed;
    try {
        parsed = new URL(candidate, app.base + '/');
    } catch (error) {
        throw new context.CancelError('API Endpoint Path is not a valid URL: ' + url);
    }
    if (parsed.username || parsed.password) {
        throw new context.CancelError('API Endpoint Path must not contain credentials.');
    }
    if (parsed.origin !== app.origin) {
        throw new context.CancelError('API Endpoint Path must target ' + app.origin + ', got ' + parsed.origin + '.');
    }
    const prefix = app.path + '/api/';
    if (!parsed.pathname.startsWith(prefix)) {
        throw new context.CancelError('API Endpoint Path must point into the API of ' + app.base + ' (' + app.base + '/api/...).');
    }
    return parsed.toString();
}

/**
 * Convert a key-value inspector input into a plain object. The Designer stores the
 * rows as the JSON string of an object; a plain object and an array of {key, value}
 * rows are accepted too.
 */
function kvToObject(value) {

    let input = value;
    if (typeof input === 'string') {
        if (!input.trim()) {
            return {};
        }
        try {
            input = JSON.parse(input);
        } catch (error) {
            throw new Error('Request Headers, Query Parameters and Filters must be a JSON object of key-value pairs.');
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
}

// ---------------------------------------------------------------- webhooks

/**
 * Register a Lime Webhooks subscription for one event. Signature version 2 is used
 * where the server offers it (/api/v2/subscription/), version 1 otherwise.
 * @returns {Promise<{ subscriptionId: string, apiVersion: string, secret: string }>}
 */
async function createSubscription(context, eventName) {

    const secret = crypto.randomBytes(32).toString('hex');
    const body = { events: [eventName], target_url: context.getWebhookUrl(), secret };
    let apiVersion = 'v2';
    let data;
    try {
        data = await apiCall(context, { method: 'POST', path: '/subscription/', data: body, apiVersion });
    } catch (err) {
        if (!isNotFound(err)) throw err;
        apiVersion = 'v1';
        try {
            data = await apiCall(context, { method: 'POST', path: '/subscription/', data: body, apiVersion });
        } catch (errV1) {
            if (isNotFound(errV1)) {
                throw new Error('Lime Webhooks is not available: the server has no /api/v1/subscription/ endpoint '
                    + 'or the API user is neither an administrator nor a member of the "Webhook Users" group.');
            }
            throw errV1;
        }
    }
    if (!data || data.id === undefined || data.id === null) {
        throw new Error('Lime CRM did not return the id of the new webhook subscription.');
    }
    return { subscriptionId: String(data.id), apiVersion, secret };
}

async function deleteSubscription(context, { subscriptionId, apiVersion = 'v1' } = {}) {

    if (!subscriptionId) return;
    try {
        await request(context, {
            method: 'DELETE',
            path: '/subscription/' + encodeURIComponent(subscriptionId),
            apiVersion
        });
    } catch (err) {
        // Already deleted in Lime CRM (or by an administrator): nothing left to clean up.
        if (!isNotFound(err)) throw err;
    }
}

async function startWebhookTrigger(context, eventName) {

    const subscription = await createSubscription(context, eventName);
    return context.saveState({ ...subscription, eventName });
}

async function stopWebhookTrigger(context) {

    const state = await context.loadState() || {};
    return deleteSubscription(context, state);
}

function getHeader(headers, name) {

    if (!headers || typeof headers !== 'object') return undefined;
    const lower = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) {
            return Array.isArray(value) ? value[0] : value;
        }
    }
    return undefined;
}

// JSON as Python's json.dumps writes it by default (", " and ": " separators, non-ASCII
// escaped). Lime CRM is a Python server; when the engine hands over no raw body, this
// reproduces the signed bytes of a delivery from the parsed body.
function asciiEscape(text) {

    return text.replace(/[\u007f-\uffff]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
}

function pythonJson(value) {

    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
    if (typeof value === 'string') return asciiEscape(JSON.stringify(value));
    if (Array.isArray(value)) return '[' + value.map(pythonJson).join(', ') + ']';
    return '{' + Object.keys(value)
        .map(key => asciiEscape(JSON.stringify(key)) + ': ' + pythonJson(value[key]))
        .join(', ') + '}';
}

function rawBodyCandidates(content) {

    const candidates = [];
    const raw = content.rawBody !== undefined ? content.rawBody : content.raw;
    if (raw !== undefined && raw !== null) {
        candidates.push(Buffer.isBuffer(raw) ? raw : Buffer.from(String(raw), 'utf8'));
        return candidates;
    }
    const data = content.data;
    if (typeof data === 'string') {
        candidates.push(Buffer.from(data, 'utf8'));
        return candidates;
    }
    if (Buffer.isBuffer(data)) {
        candidates.push(data);
        return candidates;
    }
    const compact = JSON.stringify(data === undefined ? null : data);
    candidates.push(Buffer.from(pythonJson(data), 'utf8'));
    candidates.push(Buffer.from(compact, 'utf8'));
    candidates.push(Buffer.from(asciiEscape(compact), 'utf8'));
    return candidates;
}

function safeEqual(a, b) {

    const left = Buffer.from(String(a), 'utf8');
    const right = Buffer.from(String(b), 'utf8');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * Check X-Lime-Signature of a delivery against the subscription's secret.
 * v1: sha256=<hex HMAC of the raw body>. v2: v2=<hex HMAC of
 * "v2:<delivery id>:<timestamp>:<sha256 hex of the raw body>">, refused when the
 * timestamp is more than 300 s away from now.
 * @param {string} secret
 * @param {object} content context.messages.webhook.content
 * @param {number} [nowSeconds]
 * @returns {boolean}
 */
function verifySignature(secret, content, nowSeconds = Math.floor(Date.now() / 1000)) {

    const headers = content.headers || {};
    const signature = getHeader(headers, 'x-lime-signature');
    if (!secret || typeof signature !== 'string' || !signature) {
        return false;
    }
    const candidates = rawBodyCandidates(content);
    const trimmed = signature.trim();

    if (trimmed.startsWith('v2=')) {
        const deliveryId = getHeader(headers, 'x-lime-delivery-id');
        const timestampHeader = getHeader(headers, 'x-lime-delivery-timestamp');
        const timestamp = Number.parseInt(timestampHeader, 10);
        if (!deliveryId || !Number.isFinite(timestamp)) return false;
        if (Math.abs(nowSeconds - timestamp) > SIGNATURE_WINDOW_SECONDS) return false;
        return candidates.some(raw => {
            const bodyHash = crypto.createHash('sha256').update(raw).digest('hex');
            const signed = 'v2:' + deliveryId + ':' + timestamp + ':' + bodyHash;
            const expected = 'v2=' + crypto.createHmac('sha256', secret).update(signed).digest('hex');
            return safeEqual(expected, trimmed);
        });
    }

    if (trimmed.startsWith('sha256=')) {
        return candidates.some(raw => {
            const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
            return safeEqual(expected, trimmed.toLowerCase());
        });
    }
    return false;
}

function parseBody(data) {

    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (err) {
            return null;
        }
    }
    if (Buffer.isBuffer(data)) {
        return parseBody(data.toString('utf8'));
    }
    return data;
}

/**
 * The shared receive() of the webhook triggers. Checks the subscription id and the
 * signature, ignores other events and repeated deliveries (same X-Lime-Delivery-Id).
 * @param {object} context
 * @returns {Promise<{ accepted: boolean, status?: number, body?: object }>}
 */
async function readWebhook(context) {

    const content = context.messages.webhook.content || {};
    const headers = content.headers || {};
    const state = await context.loadState() || {};

    const subscriptionId = getHeader(headers, 'x-lime-webhook-id');
    const otherSubscription = state.subscriptionId && subscriptionId !== undefined
        && String(subscriptionId) !== String(state.subscriptionId);
    if (otherSubscription) {
        await context.log({ step: 'Ignored a delivery of another webhook subscription.', subscriptionId });
        return { accepted: false };
    }

    if (!verifySignature(state.secret, content)) {
        await context.log({ step: 'Rejected a webhook call with a missing or invalid X-Lime-Signature header.' });
        return { accepted: false, status: 401 };
    }

    const payload = parseBody(content.data) || {};
    if (state.eventName && payload.event && payload.event !== state.eventName) {
        return { accepted: false };
    }

    const deliveryId = getHeader(headers, 'x-lime-delivery-id');
    if (deliveryId) {
        const cacheKey = 'limecrm-delivery-' + context.componentId + '-' + deliveryId;
        let lock;
        try {
            lock = await context.lock(cacheKey, { ttl: 10 * 1000, retryDelay: 500, maxRetryCount: 3 });
            if (await context.staticCache.get(cacheKey)) {
                return { accepted: false };
            }
            await context.staticCache.set(cacheKey, true, 10 * 60 * 1000);
        } finally {
            lock && await lock.unlock();
        }
    }

    return { accepted: true, body: payload.body || {} };
}

async function getObject(context, limetype, objectId) {

    const data = await apiCall(context, {
        path: '/limeobject/' + encodeURIComponent(limetype) + '/' + encodeURIComponent(objectId) + '/'
    });
    return mapObject(data);
}

/**
 * The newest objects of a limetype (one page, newest first by the given property).
 */
async function latestObjects(context, limetype, sortProperty, limit = 1) {

    const data = await apiCall(context, {
        path: '/limeobject/' + encodeURIComponent(limetype) + '/',
        params: { _limit: limit, _sort: '-' + sortProperty }
    });
    return extractItems(data).map(mapObject);
}

/**
 * Output options of a limeobject port (Get/Create Object, triggers).
 */
async function objectOutputOptions(context, limetype, extra = {}) {

    const properties = await getPropertiesSafe(context, limetype);
    return context.sendJson(schemaToOptions({ ...objectSchemaProperties(properties), ...extra }), 'out');
}

module.exports = {
    MAX_PAGE_SIZE,
    NAME_PATTERN,
    OBJECT_ITEM_SCHEMA,
    applicationUrl,
    authHeaders,
    withQuery,
    request,
    apiCall,
    apiGetCached,
    isNotFound,
    assertName,
    assertId,
    extractItems,
    isSingleObject,
    mapObject,
    mapFile,
    listLimetypes,
    getLimetype,
    normalizeProperties,
    getPropertiesSafe,
    toInspector,
    buildValues,
    parseJsonInput,
    parseJsonObject,
    normalizeMultiselectInput,
    objectSchemaProperties,
    schemaToOptions,
    objectOutputOptions,
    sendArrayOutput,
    getOutputPortOptions,
    toCsv,
    resolveApiUrl,
    kvToObject,
    createSubscription,
    deleteSubscription,
    startWebhookTrigger,
    stopWebhookTrigger,
    getHeader,
    pythonJson,
    verifySignature,
    readWebhook,
    getObject,
    latestObjects
};
