'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_BASE_URL = 'https://googleads.googleapis.com/v23';
const DEFAULT_PREFIX = 'googleads-objects-export';

function ensureRequired(value, message, context) {
    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(message);
    }
}

function normalizeCustomerId(customerId) {
    return String(customerId || '').replace(/[^0-9]/g, '');
}

function buildHeaders(context, { developerToken, loginCustomerId }) {
    const headers = {
        'Authorization': `Bearer ${context.auth.accessToken}`,
        'developer-token': developerToken
    };

    if (loginCustomerId) {
        headers['login-customer-id'] = normalizeCustomerId(loginCustomerId);
    }

    return headers;
}

async function searchStream(context, {
    customerId,
    developerToken,
    loginCustomerId,
    query
}) {
    const normalizedCustomerId = normalizeCustomerId(customerId);
    const headers = buildHeaders(context, { developerToken, loginCustomerId });

    const { data } = await context.httpRequest({
        method: 'POST',
        url: `${API_BASE_URL}/customers/${normalizedCustomerId}/googleAds:searchStream`,
        headers,
        data: { query }
    });

    const chunks = Array.isArray(data) ? data : [data];
    return chunks.reduce((result, chunk) => {
        if (Array.isArray(chunk.results)) {
            result.push(...chunk.results);
        }
        return result;
    }, []);
}

function hashSha256(value) {
    return crypto
        .createHash('sha256')
        .update(String(value || '').trim().toLowerCase(), 'utf8')
        .digest('hex');
}

function getOfflineUserDataJobIdFromResourceName(resourceName) {
    const match = String(resourceName || '').match(/offlineUserDataJobs\/(\d+)/);
    return match ? match[1] : null;
}

async function sendArrayOutput({
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
}

function getOutputPortOptions(context, outputType, itemSchema, { label, value }) {
    if (outputType === 'object' || outputType === 'first') {
        const options = Object.keys(itemSchema)
            .reduce((res, field) => {
                const fieldSchema = itemSchema[field];
                const { title: fieldLabel, ...schemaWithoutTitle } = fieldSchema;

                res.push({
                    label: fieldLabel,
                    value: field,
                    schema: schemaWithoutTitle
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

function toCsv(array) {
    if (!array || array.length === 0) {
        return '';
    }

    const headers = Object.keys(array[0]);
    if (headers.length === 0) {
        return '';
    }

    return [
        headers.join(','),
        ...array.map(item => {
            return Object.values(item).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property != null ? property : '';
            }).join(',');
        })
    ].join('\n');
}

module.exports = {
    ensureRequired,
    normalizeCustomerId,
    buildHeaders,
    searchStream,
    hashSha256,
    getOfflineUserDataJobIdFromResourceName,
    sendArrayOutput,
    getOutputPortOptions,
    API_BASE_URL
};
