'use strict';

const pathModule = require('path');

const API_BASE_URL = 'https://api.arcmira.com/v1';

const DEFAULT_PREFIX = 'arcmira-objects-export';

// HTTP statuses that will not succeed on a retry (bad input, auth, plan or credit gates).
const NON_RETRYABLE = [400, 401, 402, 403, 404, 409, 422];

// Arcmira errors carry { error: { type, code, message, request_id, unlock } }.
function formatApiError(err) {

    const status = err.response && err.response.status;
    const data = err.response && err.response.data;
    const apiError = data && typeof data === 'object' && data.error && typeof data.error === 'object'
        ? data.error
        : null;

    if (!status) {
        return err.message;
    }

    let message = `Arcmira API error ${status}`;
    if (apiError) {
        if (apiError.code) {
            message += ` (${apiError.code})`;
        }
        if (apiError.message) {
            message += `: ${apiError.message}`;
        }
        if (apiError.unlock && apiError.unlock.url) {
            message += ` Unlock: ${apiError.unlock.url}`;
        }
        if (apiError.request_id) {
            message += ` Request ID: ${apiError.request_id}`;
        }
    } else if (data) {
        message += `: ${typeof data === 'string' ? data : JSON.stringify(data)}`;
    }
    return message;
}

module.exports = {

    API_BASE_URL,

    getHeaders(context) {
        return {
            'Authorization': `Bearer ${context.auth.apiKey}`,
            'Accept': 'application/json'
        };
    },

    // Resolve a MakeApiCall path against the API base. Accepts "search", "/search",
    // "/v1/search" or a full https://api.arcmira.com/v1/... URL. Anything else is refused
    // so the API key is never sent to another host.
    resolveApiUrl(context, url) {

        const base = new URL(API_BASE_URL);
        let candidate;
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
            candidate = url;
        } else {
            let path = url.startsWith('/') ? url : `/${url}`;
            if (path === base.pathname || path.startsWith(`${base.pathname}/`)) {
                path = path.slice(base.pathname.length);
            }
            candidate = `${API_BASE_URL}${path}`;
        }

        let parsed;
        try {
            parsed = new URL(candidate, API_BASE_URL);
        } catch (error) {
            throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
        }

        if (parsed.username || parsed.password) {
            throw new context.CancelError('API Endpoint Path must not contain credentials.');
        }

        const underBasePath = parsed.pathname === base.pathname || parsed.pathname.startsWith(`${base.pathname}/`);
        if (parsed.origin !== base.origin || !underBasePath) {
            throw new context.CancelError(`API Endpoint Path must target ${API_BASE_URL}, got ${parsed.origin}${parsed.pathname}.`);
        }

        return parsed.toString();
    },

    // Every request goes through here: auth headers, and Arcmira's error envelope turned into a
    // readable message. Input, auth, plan and credit errors are not retried.
    async apiRequest(context, options) {

        try {
            return await context.httpRequest({
                ...options,
                headers: { ...module.exports.getHeaders(context), ...(options.headers || {}) }
            });
        } catch (err) {
            const status = err.response && err.response.status;
            const message = formatApiError(err);
            if (NON_RETRYABLE.includes(status)) {
                throw new context.CancelError(message);
            }
            const wrapped = new Error(message);
            wrapped.response = err.response;
            throw wrapped;
        }
    },

    formatApiError,

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

const toCsv = (array) => {
    if (!array.length) {
        return '';
    }
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(items => {
            return Object.values(items).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property;
            }).join(',');
        })
    ].join('\n');
};
