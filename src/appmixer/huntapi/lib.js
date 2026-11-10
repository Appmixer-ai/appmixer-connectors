'use strict';

const pathModule = require('path');

const API_BASE_URL = 'https://api.huntapi.com';
const REQUEST_TIMEOUT_MS = 120000;
const DEFAULT_PREFIX = 'huntapi-objects-export';

module.exports = {

    API_BASE_URL,

    /**
     * Headers that authenticate a request with the account's API key.
     * @param {object} context Appmixer component context (needs `auth.apiKey`)
     * @returns {object}
     */
    authHeaders(context) {

        return { 'x-api-key': context.auth.apiKey };
    },

    /**
     * Resolve a user supplied endpoint (relative path or absolute URL) against the
     * HuntAPI API base and refuse anything that would send the API key elsewhere.
     * @param {object} context Appmixer component context (for CancelError)
     * @param {string} url relative path (e.g. '/v1/usage') or absolute HuntAPI API URL
     * @returns {string} absolute URL on the HuntAPI API host
     */
    resolveApiUrl(context, url) {

        const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
            ? url
            : `${url.startsWith('/') ? '' : '/'}${url}`;

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        if (parsed.origin !== API_BASE_URL) {
            throw new context.CancelError(
                `API Endpoint Path must target ${API_BASE_URL}, got ${parsed.origin}.`
            );
        }

        return parsed.toString();
    },

    /**
     * Call the HuntAPI API with the account's key and return the parsed body.
     * context.httpRequest throws on non-2xx responses. An error body
     * {"error": "message"} has its message put on the error.
     * @param {object} args
     * @param {object} args.context Appmixer component context (needs `auth.apiKey`)
     * @param {string} args.path API path starting with a slash
     * @param {object} [args.params] query string parameters; empty values are dropped
     * @returns {Promise<*>} the parsed response body
     */
    async makeRequest({ context, path, params = {} }) {

        const query = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') query[key] = value;
        }

        const options = {
            method: 'GET',
            url: API_BASE_URL + path,
            headers: { ...this.authHeaders(context), 'Accept': 'application/json' },
            params: query,
            timeout: REQUEST_TIMEOUT_MS
        };

        try {
            const response = await context.httpRequest(options);
            return response ? response.data : null;
        } catch (err) {
            const error = err.response && err.response.data && err.response.data.error;
            const message = error && typeof error === 'object' ? error.message : error;
            if (typeof message === 'string' && message) {
                err.message = `HuntAPI: ${message}`;
            }
            throw err;
        }
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

    getOutputPortOptions(context, outputType, itemSchema, { label }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: fieldLabel, ...schemaWithoutTitle } = schema;

                    res.push({
                        label: fieldLabel, value: field, schema: schemaWithoutTitle
                    });
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
                label: label,
                value: 'result',
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: itemSchema
                    }
                }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    }
};

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value
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
