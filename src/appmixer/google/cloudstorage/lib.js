'use strict';

const pathModule = require('path');

const API_ORIGIN = 'https://storage.googleapis.com';
const API_BASE_URL = `${API_ORIGIN}/storage/v1`;
const UPLOAD_BASE_URL = `${API_ORIGIN}/upload/storage/v1`;

// The largest page the list endpoints return (objects.list and buckets.list: maxResults <= 1000).
const PAGE_SIZE = 1000;

const DEFAULT_PREFIX = 'google-cloudstorage-export';

// Output contract of one object resource (storage#object). `size`, `generation` and
// `metageneration` are int64 values the JSON API sends as strings.
const OBJECT_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'bucket', 'generation', 'metageneration', 'size', 'timeCreated', 'updated'],
    properties: {
        id: { type: 'string', title: 'ID', example: 'my-bucket/reports/2026/summary.csv/1763635200123456' },
        name: { type: 'string', title: 'Name', example: 'reports/2026/summary.csv' },
        bucket: { type: 'string', title: 'Bucket', example: 'my-bucket' },
        generation: { type: 'string', title: 'Generation', example: '1763635200123456' },
        metageneration: { type: 'string', title: 'Metageneration', example: '1' },
        contentType: { type: 'string', title: 'Content Type', example: 'text/csv' },
        size: { type: 'string', title: 'Size (Bytes)', example: '2048' },
        md5Hash: { type: 'string', title: 'MD5 Hash', example: 'XrY7u+Ae7tCTyyK7j1rNww==' },
        crc32c: { type: 'string', title: 'CRC32C', example: 'yZRlqg==' },
        etag: { type: 'string', title: 'ETag', example: 'CMDj8pvMm5EDEAE=' },
        storageClass: { type: 'string', title: 'Storage Class', example: 'STANDARD' },
        cacheControl: { type: 'string', title: 'Cache Control', example: 'no-cache' },
        contentDisposition: { type: 'string', title: 'Content Disposition', example: 'attachment; filename="summary.csv"' },
        contentEncoding: { type: 'string', title: 'Content Encoding', example: 'gzip' },
        contentLanguage: { type: 'string', title: 'Content Language', example: 'en' },
        metadata: {
            type: 'object',
            title: 'Custom Metadata',
            properties: {},
            example: { department: 'finance' }
        },
        timeCreated: { type: 'string', format: 'date-time', title: 'Time Created', example: '2026-11-20T10:30:00.123Z' },
        updated: { type: 'string', format: 'date-time', title: 'Updated', example: '2026-11-20T10:30:00.123Z' },
        mediaLink: {
            type: 'string',
            title: 'Media Link',
            example: 'https://storage.googleapis.com/download/storage/v1/b/my-bucket/o/reports%2F2026%2Fsummary.csv?generation=1763635200123456&alt=media'
        },
        selfLink: {
            type: 'string',
            title: 'Self Link',
            example: 'https://www.googleapis.com/storage/v1/b/my-bucket/o/reports%2F2026%2Fsummary.csv'
        }
    }
};

// Output contract of one bucket resource (storage#bucket).
const BUCKET_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'location', 'storageClass', 'timeCreated', 'updated'],
    properties: {
        id: { type: 'string', title: 'ID', example: 'my-bucket' },
        name: { type: 'string', title: 'Name', example: 'my-bucket' },
        projectNumber: { type: 'string', title: 'Project Number', example: '123456789012' },
        location: { type: 'string', title: 'Location', example: 'US-CENTRAL1' },
        locationType: { type: 'string', title: 'Location Type', example: 'region' },
        storageClass: { type: 'string', title: 'Storage Class', example: 'STANDARD' },
        metageneration: { type: 'string', title: 'Metageneration', example: '1' },
        etag: { type: 'string', title: 'ETag', example: 'CAE=' },
        timeCreated: { type: 'string', format: 'date-time', title: 'Time Created', example: '2026-11-20T10:30:00.123Z' },
        updated: { type: 'string', format: 'date-time', title: 'Updated', example: '2026-11-20T10:30:00.123Z' },
        selfLink: { type: 'string', title: 'Self Link', example: 'https://www.googleapis.com/storage/v1/b/my-bucket' }
    }
};

/**
 * A path segment for a bucket or an object name. Names are URL-encoded as a whole
 * (a `/` in an object name becomes `%2F`), which is what the JSON API expects. `.` and
 * `..` are rejected: the URL parser would resolve them as path steps.
 * @param {object} context
 * @param {string} value
 * @param {string} label
 * @returns {string}
 */
function pathSegment(context, value, label) {

    if (typeof value !== 'string' || !value) {
        throw new context.CancelError(`${label} is required!`);
    }
    if (value === '.' || value === '..') {
        throw new context.CancelError(`${label} cannot be "${value}".`);
    }
    return encodeURIComponent(value);
}

/**
 * Credential header for every request.
 * @param {object} context
 * @returns {object}
 */
function authHeaders(context) {

    return { 'Authorization': `Bearer ${context.auth.accessToken}` };
}

/**
 * Path of a bucket, relative to the API base URL.
 * @param {object} context
 * @param {string} bucket
 * @returns {string}
 */
function bucketPath(context, bucket) {

    return `/b/${pathSegment(context, bucket, 'Bucket')}`;
}

/**
 * Path of an object, relative to the API base URL.
 * @param {object} context
 * @param {string} bucket
 * @param {string} objectName
 * @param {string} [label]
 * @returns {string}
 */
function objectPath(context, bucket, objectName, label = 'Object Name') {

    return `${bucketPath(context, bucket)}/o/${pathSegment(context, objectName, label)}`;
}

/**
 * Call the Cloud Storage JSON API. Returns the response body.
 * @param {object} context
 * @param {{method?: string, path: string, params?: object, data?: *}} options
 * @returns {Promise<*>}
 */
async function request(context, { method = 'GET', path, params, data }) {

    const options = {
        method,
        url: `${API_BASE_URL}${path}`,
        headers: authHeaders(context)
    };
    if (params && Object.keys(params).length) {
        options.params = params;
    }
    if (data !== undefined) {
        options.data = data;
    }
    const response = await context.httpRequest(options);
    return response.data;
}

/**
 * Read every page of a list endpoint (objects.list, buckets.list).
 * @param {object} context
 * @param {string} path
 * @param {object} params
 * @returns {Promise<Array<object>>}
 */
async function listAll(context, path, params = {}) {

    const items = [];
    let pageToken;
    do {
        const data = await request(context, {
            path,
            params: { ...params, maxResults: PAGE_SIZE, ...(pageToken ? { pageToken } : {}) }
        });
        items.push(...(data?.items || []));
        pageToken = data?.nextPageToken;
    } while (pageToken);
    return items;
}

/**
 * Upload a stream as an object with a resumable upload: one request opens the session
 * with the object's metadata, a second one sends the whole content. This works for any
 * size and keeps the metadata and the content in one upload.
 * @param {object} context
 * @param {{bucket: string, name: string, contentType?: string, size?: number, stream: *}} options
 * @returns {Promise<object>} the object resource
 */
async function uploadObject(context, { bucket, name, contentType, size, stream }) {

    pathSegment(context, name, 'Object Name');
    const type = contentType || 'application/octet-stream';
    const session = await context.httpRequest({
        method: 'POST',
        url: `${UPLOAD_BASE_URL}${bucketPath(context, bucket)}/o`,
        params: { uploadType: 'resumable' },
        headers: {
            ...authHeaders(context),
            'X-Upload-Content-Type': type,
            ...(size ? { 'X-Upload-Content-Length': String(size) } : {})
        },
        data: { name, contentType: type }
    });
    const sessionUrl = session.headers?.location || session.headers?.Location;
    if (!sessionUrl) {
        throw new Error('Cloud Storage did not return an upload session URL.');
    }
    // The session URL is issued by Cloud Storage; it must stay on the API host because the
    // credential is sent with it.
    const sessionOrigin = new URL(sessionUrl).origin;
    if (sessionOrigin !== API_ORIGIN) {
        throw new Error(`Unexpected upload session host: ${sessionOrigin}`);
    }

    const { data } = await context.httpRequest({
        method: 'PUT',
        url: sessionUrl,
        headers: {
            ...authHeaders(context),
            'Content-Type': type,
            ...(size ? { 'Content-Length': size } : {})
        },
        data: stream,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
    return data;
}

/**
 * Resolve a user supplied endpoint (relative path or absolute URL) against the API base
 * and refuse anything that would send the account's credential somewhere else. A relative
 * path is appended to `https://storage.googleapis.com/storage/v1`; an absolute URL must be on
 * `https://storage.googleapis.com` (so the upload endpoints `/upload/storage/v1/...` work too).
 * Resolving through the WHATWG URL parser and comparing the origin also rejects
 * protocol-relative input such as `//example.com/x`.
 * @param {object} context
 * @param {string} url
 * @returns {string}
 */
function resolveApiUrl(context, url) {

    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//');
    const candidate = isAbsolute ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

    let parsed;
    try {
        parsed = new URL(candidate, API_BASE_URL);
    } catch (error) {
        throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
    }

    if (parsed.username || parsed.password) {
        throw new context.CancelError('API Endpoint Path must not contain credentials.');
    }

    if (parsed.origin !== API_ORIGIN) {
        throw new context.CancelError(`API Endpoint Path must target ${API_ORIGIN}, got ${parsed.origin}.`);
    }

    return parsed.toString();
}

/**
 * Parse a textarea JSON input. Empty input means "no value"; an object is passed through.
 * @param {object} context
 * @param {string|object} value
 * @param {string} label
 * @returns {object|undefined}
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
        throw new context.CancelError(`${label} must be valid JSON.`);
    }
}

/**
 * Custom object metadata: a JSON object; values are sent as strings, `null` removes a key.
 * @param {object} context
 * @param {string|object} value
 * @returns {object|undefined}
 */
function parseCustomMetadata(context, value) {

    const metadata = parseJsonInput(context, value, 'Custom Metadata');
    if (metadata === undefined) {
        return undefined;
    }
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        throw new context.CancelError('Custom Metadata must be a JSON object, for example {"department": "finance"}.');
    }
    return Object.fromEntries(Object.entries(metadata).map(([key, val]) => [
        key,
        val === null ? null : (typeof val === 'object' ? JSON.stringify(val) : String(val))
    ]));
}

/**
 * Convert a key-value inspector input into a plain object. The Designer stores the rows
 * as the JSON string of an object ('{"Accept":"application/json"}'); a plain object and an
 * array of {key, value} rows are accepted too.
 * @param {string|object|Array<{key: string, value: *}>} value
 * @returns {object}
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
}

/**
 * Normalize multiselect input (array or string) to an array.
 * Strings are treated as single values or comma-separated lists.
 * @param {string|string[]} input
 * @param {object} context
 * @param {string} fieldName
 * @returns {string[]}
 */
function normalizeMultiselectInput(input, context, fieldName) {

    if (Array.isArray(input)) {
        return input;
    } else if (typeof input === 'string') {
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else {
        throw new context.CancelError(`${fieldName} must be a string or an array`);
    }
}

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    // An empty result set is ordinary: an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, so a record with a different key order or a
    // missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

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
        const buffer = Buffer.from(toCsv(records), 'utf8');
        const componentName = context.flowDescriptor?.[context.componentId]?.label || context.componentId;
        const fileName = `${context.config?.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
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
                res.push({ label: title, value: field, schema: schemaWithoutTitle });
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

module.exports = {
    API_ORIGIN,
    API_BASE_URL,
    UPLOAD_BASE_URL,
    PAGE_SIZE,
    OBJECT_SCHEMA,
    BUCKET_SCHEMA,
    pathSegment,
    authHeaders,
    bucketPath,
    objectPath,
    request,
    listAll,
    uploadObject,
    resolveApiUrl,
    parseJsonInput,
    parseCustomMetadata,
    kvToObject,
    normalizeMultiselectInput,
    sendArrayOutput,
    getOutputPortOptions,
    toCsv
};
