'use strict';

const crypto = require('crypto');
const pathModule = require('path');
const { resolveApiDomain } = require('../endpoints');

// Bigin REST API v2. The host depends on the account's data center (www.zohoapis.com,
// www.zohoapis.eu, ...); auth.js stores it in the account's profileInfo.
// See https://www.bigin.com/developer/docs/apis/v2/
const API_PATH = '/bigin/v2';

// Module API names. "Companies" in the Bigin UI is "Accounts" in the API, deals are "Pipelines".
const MODULES = ['Contacts', 'Pipelines', 'Accounts', 'Products', 'Tasks', 'Events', 'Calls'];

// GET records accepts at most 50 field API names in `fields`.
const MAX_FIELDS = 50;
// Records per page, and the most the page/per_page parameters can reach (Get Records API).
const PER_PAGE = 200;
const MAX_RECORDS = 2000;

const DEFAULT_PREFIX = 'zoho-bigin-export';
const DEFAULT_CACHE_TTL = 2 * 60 * 1000;

const userRef = (idExample, nameExample, title) => ({
    type: 'object',
    title,
    properties: {
        id: { type: 'string', title: `${title}.ID`, example: idExample },
        name: { type: 'string', title: `${title}.Name`, example: nameExample },
        email: { type: 'string', title: `${title}.Email`, example: 'sarah.johnson@example.com' }
    }
});

const lookup = (idExample, nameExample, title) => ({
    type: 'object',
    title,
    properties: {
        id: { type: 'string', title: `${title}.ID`, example: idExample },
        name: { type: 'string', title: `${title}.Name`, example: nameExample }
    }
});

// System fields every Bigin record carries.
const COMMON_FIELDS = {
    id: { type: 'string', title: 'Record ID', example: '2034020000000489022' },
    Owner: userRef('2034020000000474061', 'Sarah Johnson', 'Owner'),
    Created_By: userRef('2034020000000457001', 'Zylker Travels', 'Created By'),
    Modified_By: userRef('2034020000000457001', 'Zylker Travels', 'Modified By'),
    Created_Time: { type: 'string', title: 'Created Time', example: '2026-04-20T17:13:47+05:30' },
    Modified_Time: { type: 'string', title: 'Modified Time', example: '2026-05-26T12:29:51+05:30' }
};

// Standard fields of each module, taken from the samples of the Bigin API v2 reference
// (insert/get records). Custom fields are returned as well; they are part of the record.
const MODULE_FIELDS = {
    Contacts: {
        First_Name: { type: 'string', title: 'First Name', example: 'Sophia' },
        Last_Name: { type: 'string', title: 'Last Name', example: 'Brooks' },
        Full_Name: { type: 'string', title: 'Full Name', example: 'Sophia Brooks' },
        Email: { type: 'string', title: 'Email', example: 'sophia.brooks@example.com' },
        Phone: { type: 'string', title: 'Phone', example: '+1 555 123 4567' },
        Mobile: { type: 'string', title: 'Mobile', example: '609-961-5520' },
        Home_Phone: { type: 'string', title: 'Home Phone', example: '+1 555 765 4321' },
        Title: { type: 'string', title: 'Title', example: 'HR Director' },
        Description: { type: 'string', title: 'Description', example: 'Manages recruitment.' },
        Account_Name: lookup('2034020000000478021', 'Apex Enterprises', 'Company'),
        Mailing_Street: { type: 'string', title: 'Mailing Street', example: '135 Walnut Dr.' },
        Mailing_City: { type: 'string', title: 'Mailing City', example: 'San Diego' },
        Mailing_State: { type: 'string', title: 'Mailing State', example: 'CA' },
        Mailing_Zip: { type: 'string', title: 'Mailing Zip', example: '92101' },
        Mailing_Country: { type: 'string', title: 'Mailing Country', example: 'United States' },
        Email_Opt_Out: { type: 'boolean', title: 'Email Opt Out', example: false },
        Last_Activity_Time: { type: 'string', title: 'Last Activity Time', example: '2026-05-26T12:29:51+05:30' }
    },
    Pipelines: {
        Deal_Name: { type: 'string', title: 'Pipeline Record Name', example: 'Adventure Tour Package' },
        Sub_Pipeline: { type: 'string', title: 'Sub-Pipeline', example: 'Sales Pipeline Standard' },
        Stage: { type: 'string', title: 'Stage', example: 'Needs Analysis' },
        Amount: { type: 'number', title: 'Amount', example: 4000 },
        Closing_Date: { type: 'string', title: 'Closing Date', example: '2026-10-10' },
        Account_Name: lookup('2034020000000459518', 'Apex Enterprises', 'Company'),
        Contact_Name: lookup('2034020000000489033', 'Sophia Brooks', 'Contact'),
        Pipeline: lookup('2034020000000095023', 'Sales - Marketing', 'Pipeline'),
        Description: { type: 'string', title: 'Description', example: 'A sample pipeline record' }
    },
    Accounts: {
        Account_Name: { type: 'string', title: 'Company Name', example: 'Techtronics Inc.' },
        Phone: { type: 'string', title: 'Phone', example: '+1-555-1234567' },
        Website: { type: 'string', title: 'Website', example: 'www.techtronics.com' },
        Description: { type: 'string', title: 'Description', example: 'Electronic gadgets.' },
        Billing_Street: { type: 'string', title: 'Billing Street', example: '123 Main Street' },
        Billing_City: { type: 'string', title: 'Billing City', example: 'Anytown' },
        Billing_State: { type: 'string', title: 'Billing State', example: 'California' },
        Billing_Code: { type: 'string', title: 'Billing Code', example: '12345' },
        Billing_Country: { type: 'string', title: 'Billing Country', example: 'United States' }
    },
    Products: {
        Product_Name: { type: 'string', title: 'Product Name', example: 'Adventure Safari' },
        Product_Code: { type: 'string', title: 'Product Code', example: 'ADV001' },
        Unit_Price: { type: 'number', title: 'Unit Price', example: 500 },
        Product_Category: { type: 'string', title: 'Product Category', example: 'Safari' },
        Product_Active: { type: 'boolean', title: 'Product Active', example: true },
        Description: { type: 'string', title: 'Description', example: 'A 7-day tour.' }
    },
    Tasks: {
        Subject: { type: 'string', title: 'Subject', example: 'Follow-up email to Ava Bell' },
        Due_Date: { type: 'string', title: 'Due Date', example: '2026-07-25' },
        Status: { type: 'string', title: 'Status', example: 'Not Started' },
        Priority: { type: 'string', title: 'Priority', example: 'Normal' },
        Related_To: lookup('2034020000000489080', 'Wellness Retreat Package', 'Related To'),
        Description: { type: 'string', title: 'Description', example: 'Contact Ava Bell.' }
    },
    Events: {
        Event_Title: { type: 'string', title: 'Event Title', example: 'Kick-off meeting' },
        Start_DateTime: { type: 'string', title: 'Start Date Time', example: '2026-08-20T10:00:00+05:30' },
        End_DateTime: { type: 'string', title: 'End Date Time', example: '2026-08-20T11:00:00+05:30' },
        All_day: { type: 'boolean', title: 'All Day', example: false },
        Venue: { type: 'string', title: 'Venue', example: 'Online (Zoom)' },
        Related_To: lookup('2034020000000478422', 'Ski Vacation Package', 'Related To'),
        Description: { type: 'string', title: 'Description', example: 'This is a sample event.' }
    },
    Calls: {
        Subject: { type: 'string', title: 'Subject', example: 'Cruise Package Discussion' },
        Call_Type: { type: 'string', title: 'Call Type', example: 'Outbound' },
        Call_Start_Time: { type: 'string', title: 'Call Start Time', example: '2026-07-12T15:30:00+05:30' },
        Call_Duration: { type: 'string', title: 'Call Duration', example: '90:00' },
        Call_Agenda: { type: 'string', title: 'Call Agenda', example: 'Discuss prices.' },
        Contact_Name: lookup('2034020000000489033', 'Sophia Brooks', 'Contact'),
        Related_To: lookup('2034020000000489123', 'Cruise Package', 'Related To'),
        Description: { type: 'string', title: 'Description', example: 'Sample call.' }
    }
};

/**
 * Property map of a record of the module: system fields + the module's standard fields.
 * @param {string} moduleName
 * @returns {Object}
 */
const recordProperties = moduleName => ({ ...COMMON_FIELDS, ...(MODULE_FIELDS[moduleName] || {}) });

// One CSV cell per RFC 4180: null/undefined -> empty, objects -> JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {

    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {

    if (!records.length) return '';
    // Cells are taken by header column: Bigin omits empty fields per record.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

/**
 * Turns a Bigin error answer into an Error carrying the code, message and details Bigin sent.
 * @param {Object} item One item of the `data` array, or the error body.
 * @returns {Error}
 */
const biginError = (item) => {

    const details = item.details && Object.keys(item.details).length ? ' ' + JSON.stringify(item.details) : '';
    const error = new Error(`${item.code || 'ERROR'}: ${item.message || 'Bigin refused the request.'}${details}`);
    error.code = item.code;
    error.data = item;
    return error;
};

/**
 * API host of the connected account (the data center stored in profileInfo).
 * @param {Object} context
 * @returns {string} e.g. https://www.zohoapis.eu
 */
const apiDomain = context => resolveApiDomain(context.profileInfo || {});

/**
 * The one place that turns a connected account into request headers.
 * @param {Object} context
 * @returns {Object}
 */
const authHeaders = context => ({ 'Authorization': `Zoho-oauthtoken ${context.auth.accessToken}` });

/**
 * Calls the Bigin API. Bigin answers errors with a JSON body ({ code, message, details });
 * that body becomes the error message, so the user sees why the request was refused.
 * @param {Object} context
 * @param {Object} options
 * @param {string} [options.method]
 * @param {string} options.path Path after /bigin/v2, starting with '/'.
 * @param {Object} [options.params]
 * @param {Object} [options.data]
 * @returns {Promise<Object>} Response body ({} for 204 No Content).
 */
const request = async (context, { method = 'GET', path, params, data }) => {

    const options = {
        method,
        url: `${apiDomain(context)}${API_PATH}${path}`,
        headers: authHeaders(context)
    };
    if (params && Object.keys(params).length) {
        options.params = params;
    }
    if (data !== undefined) {
        options.data = data;
    }
    try {
        const response = await context.httpRequest(options);
        return response.data || {};
    } catch (err) {
        const body = err.response?.data;
        if (body && typeof body === 'object') {
            const item = Array.isArray(body.data) ? body.data[0] : body;
            if (item && (item.code || item.message)) {
                throw biginError(item);
            }
        }
        throw err;
    }
};

/**
 * Field metadata of a module, cached per connected Bigin user and module: the metadata is
 * organization specific and the inspector asks for it in bursts.
 * @param {Object} context
 * @param {string} moduleName
 * @returns {Promise<Array<Object>>}
 */
const getFields = async (context, moduleName) => {

    const tokenHash = crypto.createHash('sha256').update(String(context.auth?.accessToken)).digest('hex');
    const key = `zoho-bigin-fields:${context.profileInfo?.id || tokenHash}:${moduleName}`;
    let lock;
    try {
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const { fields } = await request(context, { path: '/settings/fields', params: { module: moduleName } });
        const result = Array.isArray(fields) ? fields : [];
        await context.staticCache.set(key, result, context.config?.listCacheTTL || DEFAULT_CACHE_TTL);
        return result;
    } finally {
        await lock?.unlock();
    }
};

/**
 * Value of the `fields` query parameter (mandatory for GET records): the fields the user
 * listed, or the module's fields from the metadata (at most 50, the API limit).
 * @param {Object} context
 * @param {string} moduleName
 * @param {string|Array<string>} [fieldsInput] Comma separated field API names.
 * @returns {Promise<string>}
 */
const fieldsParam = async (context, moduleName, fieldsInput) => {

    let names = Array.isArray(fieldsInput) ? fieldsInput : String(fieldsInput || '').split(',');
    names = names.map(name => String(name).trim()).filter(Boolean);
    const userListed = names.length > 0;
    if (!userListed) {
        const fields = await getFields(context, moduleName);
        names = fields.filter(field => field.api_name && field.visible !== false).map(field => field.api_name);
        // The time fields first: the 50 field limit must not drop what the triggers sort and compare on.
        const first = ['Created_Time', 'Modified_Time'].filter(name => names.includes(name));
        names = [...first, ...names.filter(name => !first.includes(name))];
        if (!names.length) {
            names = Object.keys(recordProperties(moduleName)).filter(name => name !== 'id');
        }
    }
    if (names.length > MAX_FIELDS) {
        if (userListed) {
            throw new context.CancelError(`Bigin returns at most ${MAX_FIELDS} fields, ${names.length} were given.`);
        }
        names = names.slice(0, MAX_FIELDS);
    }
    return names.join(',');
};

/**
 * Pages through GET /{module} (or /{module}/search) and returns up to `max` records.
 * A 204 No Content answer (nothing matches) yields an empty list.
 * @param {Object} context
 * @param {string} path
 * @param {Object} params
 * @param {number} [max]
 * @returns {Promise<Array<Object>>}
 */
const getPaged = async (context, path, params, max = MAX_RECORDS) => {

    const perPage = Math.min(PER_PAGE, max);
    let records = [];
    let page = 1;
    let more = true;
    while (more && records.length < max) {
        // eslint-disable-next-line camelcase
        const body = await request(context, { path, params: { ...params, page, per_page: perPage } });
        const data = Array.isArray(body.data) ? body.data : [];
        records = records.concat(data);
        more = Boolean(body.info?.more_records) && data.length > 0;
        page += 1;
    }
    return records.slice(0, max);
};

module.exports = {

    API_PATH,
    MODULES,
    MAX_FIELDS,
    MAX_RECORDS,
    COMMON_FIELDS,
    MODULE_FIELDS,
    recordProperties,
    toCsv,
    apiDomain,
    authHeaders,
    request,
    getFields,
    fieldsParam,
    getPaged,

    /**
     * Asserts the module is one of the modules the Bigin record APIs accept.
     * @param {Object} context
     * @param {string} moduleName
     * @returns {string}
     */
    assertModule(context, moduleName) {

        if (!moduleName) {
            throw new context.CancelError('Module is required!');
        }
        if (!MODULES.includes(moduleName)) {
            throw new context.CancelError(
                `Unsupported module "${moduleName}". Use one of the module API names: ${MODULES.join(', ')}.`
            );
        }
        return moduleName;
    },

    /**
     * Result of a single-record write (insert/update/delete). Bigin may answer 2xx and still
     * refuse the record (status "error" in the data item).
     * @param {Object} body Response body.
     * @returns {Object} The `details` of the record.
     */
    recordResult(body) {

        const item = Array.isArray(body?.data) ? body.data[0] : null;
        if (!item) {
            throw new Error('Bigin returned no result for the record.');
        }
        if (item.status === 'error') {
            throw biginError(item);
        }
        return item.details || {};
    },

    /**
     * Inserts one record and returns the `details` Bigin answers with (id, created/modified).
     * @param {Object} context
     * @param {string} moduleName
     * @param {Object} record Field API names and values.
     * @returns {Promise<Object>}
     */
    async createRecord(context, moduleName, record) {

        const body = await request(context, { method: 'POST', path: `/${moduleName}`, data: { data: [record] } });
        return module.exports.recordResult(body);
    },

    /**
     * A single record. Throws when the record does not exist.
     * @param {Object} context
     * @param {string} moduleName
     * @param {string} recordId
     * @param {string} [fields] Comma separated field API names.
     * @returns {Promise<Object>}
     */
    async getRecord(context, moduleName, recordId, fields) {

        const body = await request(context, {
            path: `/${moduleName}/${encodeURIComponent(recordId)}`,
            params: { fields: await fieldsParam(context, moduleName, fields) }
        });
        const record = Array.isArray(body.data) ? body.data[0] : null;
        if (!record) {
            throw new context.CancelError(`Record ${recordId} was not found in ${moduleName}.`);
        }
        return record;
    },

    /**
     * Records of a module, newest first.
     * @param {Object} context
     * @param {string} moduleName
     * @param {Object} [options]
     * @param {string} [options.sortBy] Field to sort on, newest first.
     * @param {number} [options.max]
     * @param {string} [options.fields]
     * @returns {Promise<Array<Object>>}
     */
    async getLatestRecords(context, moduleName, { sortBy = 'Created_Time', max = 200, fields } = {}) {

        return getPaged(context, `/${moduleName}`, {
            fields: await fieldsParam(context, moduleName, fields),
            // eslint-disable-next-line camelcase
            sort_by: sortBy,
            // eslint-disable-next-line camelcase
            sort_order: 'desc'
        }, max);
    },

    /**
     * Parses a JSON object input (record fields). Empty means no fields.
     * @param {Object} context
     * @param {string|Object} value
     * @param {string} label
     * @returns {Object}
     */
    parseRecordInput(context, value, label) {

        if (value === null || value === undefined || value === '') {
            return {};
        }
        let parsed = value;
        if (typeof value === 'string') {
            try {
                parsed = JSON.parse(value);
            } catch (err) {
                throw new context.CancelError(`${label} must be a valid JSON object.`);
            }
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new context.CancelError(`${label} must be a JSON object of field API names and values.`);
        }
        return parsed;
    },

    /**
     * Resolves a MakeApiCall endpoint (relative path or absolute URL) against the account's API
     * host and refuses anything that would send the access token elsewhere. Resolving through the
     * WHATWG URL parser also rejects protocol-relative input such as //example.com/x.
     * @param {Object} context
     * @param {string} url
     * @returns {string}
     */
    resolveApiUrl(context, url) {

        const base = apiDomain(context);
        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
            ? url
            : `${url.startsWith('/') ? '' : '/'}${url}`;

        let parsed;
        try {
            parsed = new URL(candidate, base);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }
        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }
        if (parsed.origin !== new URL(base).origin) {
            throw new context.CancelError(`API Endpoint Path must target ${base}, got ${parsed.origin}.`);
        }
        return parsed.toString();
    },

    /**
     * Parses a textarea JSON input. Empty input means "no body".
     * @param {Object} context
     * @param {string|Object} value
     * @param {string} label
     * @returns {Object|undefined}
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
     * Converts a key-value inspector input into a plain object. The Designer stores the rows as
     * the JSON string of an object ('{"Accept":"application/json"}'); a plain object and an array
     * of {key, value} rows are accepted too.
     * @param {string|Object|Array} value
     * @returns {Object}
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
    },

    async sendArrayOutput({ context, outputPortName = 'out', outputType = 'array', records = [] }) {

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

    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: fieldLabel, ...schemaWithoutTitle } = schema;
                    res.push({ label: fieldLabel, value: field, schema: schemaWithoutTitle });
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
            }, { label: 'Items Count', value: 'count', schema: { type: 'integer' } }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    },

    /**
     * Output port options of one record of the module (GetRecord and the triggers). Built from
     * the static module schema, no API call.
     * @param {string} moduleName
     * @returns {Array<Object>}
     */
    recordOutputOptions(moduleName) {

        return Object.entries(recordProperties(moduleName)).map(([field, schema]) => {
            const { title, ...rest } = schema;
            return { label: title, value: field, schema: rest };
        });
    }
};
