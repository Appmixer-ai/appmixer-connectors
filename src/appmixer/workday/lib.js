'use strict';

const pathModule = require('path');

const DEFAULT_PREFIX = 'workday-objects-export';

// The host and the tenant are typed by the user and become part of every request
// URL that carries the access token (and, in auth.js, the client secret and the
// refresh token). Accept only a Workday hostname and a plain tenant name, checked
// as typed: "evil.example/x?" must never become the request host.
const HOST_LABEL = '[a-z0-9](?:[a-z0-9-]*[a-z0-9])?';
const HOST_PATTERN = new RegExp(`^${HOST_LABEL}(?:\\.${HOST_LABEL})*\\.(?:workday|myworkday)\\.com$`, 'i');
const TENANT_PATTERN = /^[a-z0-9_-]+$/i;
// A Workday ID (WID) or a reference ID such as Employee_ID=21005 (REST API Fundamentals).
const OBJECT_ID_PATTERN = /^[a-z0-9_.-]+(?:=[a-z0-9_.-]+)?$/i;

// REST service versions used by the components (Workday REST Services Directory).
const COMMON_SERVICE = 'common/v1';
const WQL_SERVICE = 'wql/v1';

/**
 * The https origin of the user's Workday host. Throws before any request when the
 * host is not a plain Workday hostname.
 * @param {string} host e.g. wd2-impl-services1.workday.com
 * @returns {string}
 */
const hostOrigin = function(host) {

    if (typeof host !== 'string' || !HOST_PATTERN.test(host)) {
        throw new Error('Invalid Workday host. Enter the hostname only, e.g. "wd2-impl-services1.workday.com".');
    }
    return `https://${host.toLowerCase()}`;
};

/**
 * The tenant name, checked as typed.
 * @param {string} tenant
 * @returns {string}
 */
const tenantName = function(tenant) {

    if (typeof tenant !== 'string' || !TENANT_PATTERN.test(tenant)) {
        throw new Error('Invalid Workday tenant. Enter the tenant name only, e.g. "acme" or "acme_dpt1".');
    }
    return tenant;
};

/**
 * Token endpoint of the tenant: https://{host}/ccx/oauth2/{tenant}/token.
 * @param {string} host
 * @param {string} tenant
 * @returns {string}
 */
const tokenUrl = function(host, tenant) {

    return `${hostOrigin(host)}/ccx/oauth2/${tenantName(tenant)}/token`;
};

/**
 * Base URL of a REST service for the account: https://{host}/api/{service}/{version}/{tenant}.
 * @param {object} context
 * @param {string} service e.g. 'common/v1'
 * @returns {string}
 */
const restBaseUrl = function(context, service) {

    return `${hostOrigin(context.auth.host)}/api/${service}/${tenantName(context.auth.tenant)}`;
};

/**
 * Validate a Workday object ID (WID or Reference_ID=value) before it goes into a path.
 * @param {object} context
 * @param {string} id
 * @param {string} label
 * @returns {string}
 */
const objectId = function(context, id, label) {

    if (!id) {
        throw new context.CancelError(`${label} is required!`);
    }
    const value = String(id).trim();
    if (!OBJECT_ID_PATTERN.test(value)) {
        throw new context.CancelError(`${label} must be a Workday ID or a reference ID such as Employee_ID=21005.`);
    }
    return value;
};

const authHeaders = function(context) {

    return { 'Authorization': `Bearer ${context.auth.token}` };
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

module.exports = {

    COMMON_SERVICE,
    WQL_SERVICE,
    hostOrigin,
    tenantName,
    tokenUrl,
    restBaseUrl,
    objectId,
    authHeaders,
    toCsv,

    /**
     * GET one page (the REST maximum, 100 objects) of a collection.
     * @param {object} context
     * @param {string} path path below the service base, e.g. '/workers'
     * @param {object} [params] extra query parameters
     * @returns {Promise<{total: number, data: Array}>}
     */
    async getCollection(context, path, params = {}) {

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${restBaseUrl(context, COMMON_SERVICE)}${path}`,
            headers: authHeaders(context),
            params: { limit: 100, ...params }
        });
        return { total: data?.total || 0, data: Array.isArray(data?.data) ? data.data : [] };
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the
     * account's Workday host and refuse anything that would send the access token
     * somewhere else. A literal {tenant} in the path is replaced with the account's tenant.
     * @param {object} context
     * @param {string} url
     * @returns {string}
     */
    resolveApiUrl(context, url) {

        const origin = hostOrigin(context.auth.host);
        const withTenant = String(url).split('{tenant}').join(tenantName(context.auth.tenant));
        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(withTenant) || withTenant.startsWith('//')
            ? withTenant
            : `${withTenant.startsWith('/') ? '' : '/'}${withTenant}`;

        let parsed;
        try {
            parsed = new URL(candidate, origin);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== origin) {
            throw new context.CancelError(`API Endpoint Path must target ${origin}, got ${parsed.origin}.`);
        }

        return parsed.toString();
    },

    /**
     * Parse a textarea JSON input. Empty input means "no body".
     * @param {object} context
     * @param {string|object} value
     * @param {string} label
     * @returns {object|undefined}
     */
    parseJsonInput(context, value, label) {

        if (value === null || value === undefined || value === '') {
            return undefined;
        }
        if (typeof value === 'object') {
            return value;
        }
        try {
            return JSON.parse(value);
        } catch (error) {
            throw new context.CancelError(`${label} must be valid JSON.`);
        }
    },

    /**
     * Convert a key-value inspector input into a plain object. The Designer stores
     * the rows as the JSON string of an object; a plain object and an array of
     * {key, value} rows are accepted too.
     * @param {string|object|Array<{key: string, value: *}>} value
     * @returns {object}
     */
    kvToObject(value) {

        let input = value;
        if (typeof input === 'string') {
            if (!input.trim()) {
                return {};
            }
            try {
                input = JSON.parse(input);
            } catch (error) {
                throw new Error('Key-value inputs must be a JSON object of key-value pairs.');
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
            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
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
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};
