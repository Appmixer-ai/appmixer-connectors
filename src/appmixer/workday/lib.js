'use strict';

const crypto = require('crypto');
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
// It starts with a letter or a digit, so "." and ".." never become a path segment.
const OBJECT_ID_PATTERN = /^[a-z0-9][a-z0-9_.-]*(?:=[a-z0-9_.-]+)?$/i;

// REST service versions used by the components (Workday REST Services Directory).
const COMMON_SERVICE = 'common/v1';
const STAFFING_SERVICE = 'staffing/v6';
const WQL_SERVICE = 'wql/v1';

// The REST maximum page size ("limit" default 20, maximum 100).
const PAGE_SIZE = 100;
// Workday answers 429 when a tenant is throttled; a collection of several
// hundred pages must survive that instead of failing half way.
const MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 30000;
// Organization chart lookups run in small batches to stay under the tenant throttle.
const HIERARCHY_BATCH = 5;
// Workday caps a response collection at one million instances; more pages than
// that means the server ignores "offset" and the loop would never end.
const MAX_PAGES = 10000;
// How many levels up the manager lookup climbs when an organization has no manager
// other than the worker.
const MAX_MANAGER_LEVELS = 10;
const SOURCE_CACHE_TTL = 2 * 60 * 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

/**
 * context.httpRequest that waits and retries when Workday throttles the tenant (429).
 * @param {object} context
 * @param {object} options
 * @returns {Promise<object>}
 */
const request = async function(context, options) {

    for (let attempt = 0; ; attempt++) {
        try {
            return await context.httpRequest(options);
        } catch (error) {
            if (error?.response?.status !== 429 || attempt >= MAX_RETRIES) {
                throw error;
            }
            const retryAfter = Number(error.response.headers?.['retry-after']);
            const delay = retryAfter > 0 ? retryAfter * 1000 : DEFAULT_RETRY_DELAY * (attempt + 1);
            await sleep(Math.min(delay, MAX_RETRY_DELAY));
        }
    }
};

/**
 * GET every object of a REST collection, page by page (limit 100 + offset).
 * @param {object} context
 * @param {string} service e.g. 'staffing/v6'
 * @param {string} path path below the service base, e.g. '/workers'
 * @param {object} [params] extra query parameters
 * @returns {Promise<Array>}
 */
const getAll = async function(context, service, path, params = {}) {

    const url = `${restBaseUrl(context, service)}${path}`;
    const records = [];
    let total = 0;
    for (let pageNumber = 0; pageNumber < MAX_PAGES; pageNumber++) {
        const { data } = await request(context, {
            method: 'GET',
            url,
            headers: authHeaders(context),
            params: { ...params, limit: PAGE_SIZE, offset: records.length }
        });
        const page = Array.isArray(data?.data) ? data.data : [];
        records.push(...page);
        // The largest "total" seen counts: a page that reports none (or 0) must not
        // end the loop early.
        if (Number.isInteger(data?.total)) {
            total = Math.max(total, data.total);
        }
        // A short page is the last one; "total" ends the loop one request earlier
        // when the collection size is an exact multiple of the page size.
        if (page.length < PAGE_SIZE || (total > 0 && records.length >= total)) {
            return records;
        }
    }
    throw new Error(`Workday returned more than ${MAX_PAGES} pages for ${path}; the result was not read to the end.`);
};

/**
 * GET one object of a REST service.
 * @param {object} context
 * @param {string} service
 * @param {string} path
 * @returns {Promise<object>}
 */
const getOne = async function(context, service, path) {

    const { data } = await request(context, {
        method: 'GET',
        url: `${restBaseUrl(context, service)}${path}`,
        headers: authHeaders(context)
    });
    return data;
};

/**
 * True when a Workday reference object ({ id, <Type>_ID }) is the one the user
 * asked for: by Workday ID, by reference ID, or by "Type=Value".
 * @param {object} reference e.g. primaryJob.location
 * @param {string} referenceKey e.g. 'Location_ID'
 * @param {string} wanted
 * @returns {boolean}
 */
const matchesReference = function(reference, referenceKey, wanted) {

    if (!reference) {
        return false;
    }
    const value = String(wanted).trim();
    const referenceId = reference[referenceKey] === undefined ? undefined : String(reference[referenceKey]);
    const separator = value.indexOf('=');
    if (separator !== -1) {
        // "Type=Value" names the reference type: Location_ID=X is not an organization.
        return value.slice(0, separator) === referenceKey && referenceId === value.slice(separator + 1);
    }
    return reference.id === value || referenceId === value;
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
    // Workday leaves out fields per record, so the header is the union of all keys,
    // not the keys of the first record.
    const columns = [...new Set(records.flatMap(record => Object.keys(record)))];
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

module.exports = {

    COMMON_SERVICE,
    STAFFING_SERVICE,
    WQL_SERVICE,
    request,
    getAll,
    getOne,
    hostOrigin,
    tenantName,
    tokenUrl,
    restBaseUrl,
    objectId,
    authHeaders,
    toCsv,

    /**
     * Workers with their current staffing information (staffing/v6), every page.
     * Search, email and terminated workers are filtered by Workday; the REST API has
     * no organization or location filter, so those two are applied to the primary
     * job of each worker here.
     * @param {object} context
     * @param {object} [filters]
     * @param {string} [filters.search] name or employee ID
     * @param {string} [filters.email]
     * @param {string} [filters.organizationId] Workday ID or Organization_Reference_ID
     * @param {string} [filters.locationId] Workday ID or Location_ID
     * @param {boolean} [filters.includeTerminatedWorkers]
     * @returns {Promise<Array>}
     */
    async listWorkers(context, filters = {}) {

        const { search, email, organizationId, locationId, includeTerminatedWorkers } = filters;
        const params = {};
        if (search) params.search = search;
        if (email) params.email = email;
        if (includeTerminatedWorkers) params.includeTerminatedWorkers = true;

        const workers = await getAll(context, STAFFING_SERVICE, '/workers', params);
        return workers.filter(worker => {
            const job = worker?.primaryJob;
            return (!organizationId
                    || matchesReference(job?.supervisoryOrganization, 'Organization_Reference_ID', organizationId))
                && (!locationId || matchesReference(job?.location, 'Location_ID', locationId));
        });
    },

    /**
     * The line manager of a worker: the manager of the worker's primary supervisory
     * organization. A worker who leads that organization (or an organization without
     * a manager) reports to the manager of the superior organization.
     * @param {object} context
     * @param {object} worker a staffing/v6 worker
     * @returns {Promise<object|null>} null when no manager can be resolved (top of the hierarchy)
     */
    async resolveManager(context, worker) {

        const organizationId = worker?.primaryJob?.supervisoryOrganization?.id;
        if (!organizationId) {
            return null;
        }
        const other = (managers) => (Array.isArray(managers) ? managers : []).find(m => m?.id && m.id !== worker.id);

        const organization = await getOne(context, STAFFING_SERVICE, `/supervisoryOrganizations/${organizationId}`);
        let reference = other(organization?.managers);
        // Climb the hierarchy until an organization is led by somebody else.
        const visited = new Set([organizationId]);
        let current = organizationId;
        while (!reference && visited.size <= MAX_MANAGER_LEVELS) {
            const superior = await this.getSuperiorOrganization(context, current);
            if (!superior || visited.has(superior.id)) {
                break;
            }
            visited.add(superior.id);
            reference = other(superior.managers);
            current = superior.id;
        }
        if (!reference) {
            return null;
        }

        const manager = await getOne(context, STAFFING_SERVICE, `/workers/${reference.id}`);
        return {
            id: reference.id,
            descriptor: manager?.descriptor || reference.descriptor,
            workerId: manager?.workerId,
            email: manager?.person?.email,
            businessTitle: manager?.primaryJob?.businessTitle
        };
    },

    /**
     * The organization one level up, from the organization chart.
     * @param {object} context
     * @param {string} organizationId Workday ID
     * @returns {Promise<object|undefined>} undefined for a top level organization
     */
    async getSuperiorOrganization(context, organizationId) {

        const nodes = await getAll(context, STAFFING_SERVICE, `/supervisoryOrganizations/${organizationId}/orgChart`);
        // Only the node of this organization counts: the superior of another node is
        // not its parent.
        const superior = nodes.find(n => n?.id === organizationId)?.superior;
        return superior?.id && superior.id !== organizationId ? superior : undefined;
    },

    /**
     * Supervisory organizations (staffing/v6), every page.
     * @param {object} context
     * @param {object} [options]
     * @param {boolean} [options.includeHierarchy] add "superior" (the parent organization) to each one
     * @returns {Promise<Array>}
     */
    async listSupervisoryOrganizations(context, { includeHierarchy } = {}) {

        const organizations = await getAll(context, STAFFING_SERVICE, '/supervisoryOrganizations');
        if (!includeHierarchy) {
            return organizations;
        }

        const result = [];
        for (let start = 0; start < organizations.length; start += HIERARCHY_BATCH) {
            const batch = organizations.slice(start, start + HIERARCHY_BATCH);
            result.push(...await Promise.all(batch.map(async organization => {
                const superior = await this.getSuperiorOrganization(context, organization.id);
                if (!superior) {
                    return organization;
                }
                const { id, descriptor, name, code } = superior;
                return {
                    ...organization,
                    superior: {
                        id,
                        descriptor,
                        name,
                        code,
                        Organization_Reference_ID: superior.Organization_Reference_ID
                    }
                };
            })));
        }
        return result;
    },

    /**
     * Run a lookup for an inspector dropdown: cached for two minutes per account and
     * never failing the inspector (an empty list lets the user type the value).
     * @param {object} context
     * @param {string} name cache key part
     * @param {Function} fetch
     * @returns {Promise<Array>}
     */
    async cachedSource(context, name, fetch) {

        const key = crypto.createHash('sha256')
            .update(JSON.stringify([name, context.auth.host, context.auth.tenant, context.auth.token]))
            .digest('hex');
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            if (cached) {
                return cached;
            }
            const records = await fetch();
            await context.staticCache.set(key, records, context.config?.listCacheTTL || SOURCE_CACHE_TTL);
            return records;
        } catch (error) {
            return [];
        } finally {
            await lock?.unlock();
        }
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
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }, {
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
