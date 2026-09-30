'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_VERSION = '2022-06-28';

const BASE_URL = 'https://api.notion.com/v1';

const DEFAULT_PREFIX = 'notion-objects-export';

module.exports = {
    API_VERSION,
    async callEndpoint(context, endpoint, {
        method = 'GET',
        params = {},
        data = null,
        headers = {}
    } = {}) {
        const options = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Notion-Version': API_VERSION, //api version from config.js,
                'Content-Type': 'application/json',
                ...headers
            },
            params
        };

        if (data) {
            options.data = data;
        }

        return await context.httpRequest(options);
    },

    // Shared request+shape path for database-item triggers. Queries a database
    // sorted by `timestamp` in the given `direction` and returns the raw items
    // (the triggers emit the unmodified Notion item object).
    async queryDatabaseItems(context, databaseId, { timestamp, direction = 'descending', pageSize } = {}) {
        const data = {
            sorts: [
                {
                    'timestamp': timestamp,
                    'direction': direction
                }
            ]
        };
        if (pageSize) {
            data.page_size = pageSize;
        }
        const response = await this.callEndpoint(context, `/databases/${databaseId}/query`, {
            method: 'POST',
            data
        });
        return response.data.results || [];
    },

    // Caches the result of `fn` for dynamic source (inspector dropdown) calls. The
    // designer fires those in a burst whenever an inspector opens: the lock lets the
    // first caller populate the cache while the rest wait and read the cached value.
    // `keyParts` must name everything that shapes the result; the token is always
    // part of the key, so an entry is never shared between accounts.
    async withCache(context, keyParts, fn) {
        const key = crypto.createHash('sha256')
            .update(JSON.stringify({ keyParts, token: context.auth.accessToken }))
            .digest('hex');
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            if (cached) {
                return cached;
            }
            const result = await fn();
            await context.staticCache.set(key, result, context.config.listCacheTTL || (2 * 60 * 1000));
            return result;
        } finally {
            lock?.unlock();
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
    // An empty result set is ordinary (new account, nothing shared with the
    // integration), so never index into array[0] before checking — that throws a
    // TypeError that ends the flow instead of writing an empty file.
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
