'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const DEFAULT_PREFIX = 'hubbi-objects-export';

// 120s, matching the platform default for dynamic source lists.
const DEFAULT_LIST_CACHE_TTL = 2 * 60 * 1000;

function getCacheKey(obj) {

    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

module.exports = {

    // Absolute URL of a HubBI endpoint. The base URL comes from the account and
    // may or may not carry a trailing slash.
    apiUrl(context, path) {

        return `${context.auth.baseUrl.replace(/\/$/, '')}${path}`;
    },

    // Every GET against HubBI goes through here, so the cached and uncached
    // paths issue an identical request.
    apiGet(context, url) {

        return context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.token}`,
                'Accept': 'application/json'
            }
        });
    },

    // Cached variant of apiGet for inspector dropdown (source) calls. The
    // designer fires those in a concurrent burst - one per dropdown, several
    // dropdowns per inspector - and a hub list changes rarely, so serving them
    // from cache keeps a single inspector open from turning into a burst of
    // identical requests against a 5 req/s quota.
    //
    // The lock is part of that: the first caller populates the cache while the
    // rest wait on it and then read the cached value, so a cold cache still
    // results in one upstream call instead of one per dropdown.
    //
    // The key covers the token and client key as well as the URL, so entries are
    // never shared between accounts.
    async callEndpointCached(context, url) {

        let lock;
        try {
            const key = getCacheKey({
                url,
                token: context.auth.token,
                clientKey: context.auth.clientKey
            });
            lock = await context.lock(key);

            const cached = await context.staticCache.get(key);
            if (cached) {
                return { data: cached };
            }

            const { data } = await this.apiGet(context, url);

            await context.staticCache.set(
                key,
                data,
                context.config.listCacheTTL || DEFAULT_LIST_CACHE_TTL
            );

            return { data };
        } finally {
            lock?.unlock();
        }
    },

    mapFieldType(netType) {

        const t = String(netType || '').trim().toLowerCase();
        switch (t) {
            case 'int16':
            case 'int32':
            case 'int64':
            case 'long':
            case 'short':
            case 'byte':
            case 'sbyte':
            case 'uint16':
            case 'uint32':
            case 'uint64':
            case 'integer':
                return { inspectorType: 'number', schema: { type: 'integer', example: 42 } };
            case 'double':
            case 'decimal':
            case 'single':
            case 'float':
                return { inspectorType: 'number', schema: { type: 'number', example: 42.5 } };
            case 'boolean':
            case 'bool':
                return { inspectorType: 'toggle', schema: { type: 'boolean', example: true } };
            case 'datetime':
            case 'datetimeoffset':
                return {
                    inspectorType: 'date-time',
                    inspectorConfig: { enableTime: true },
                    schema: { type: 'string', format: 'date-time', example: '2026-01-01T09:00:00.000Z' }
                };
            case 'date':
            case 'dateonly':
                return {
                    inspectorType: 'date-time',
                    schema: { type: 'string', format: 'date', example: '2026-01-01' }
                };
            case 'guid':
            case 'uuid':
                return { inspectorType: 'text', schema: { type: 'string', format: 'uuid', example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' } };
            case 'string':
            case 'char':
            case '':
                return { inspectorType: 'text', schema: { type: 'string', example: 'Example value' } };
            default:
                return { inspectorType: 'text', schema: { type: 'string', example: 'Example value' } };
        }
    },

    // Re-classify HubBI HTTP errors for the Appmixer retry engine. By default
    // the engine treats 409 as a permanent client error (no retry) and an
    // unclassified 423 as "unknown" (retried). HubBI's semantics are the
    // opposite, so:
    //   - 409 (Conflict) -> rethrow a plain Error with no HTTP status attached.
    //     The classifier then sees an "unknown" error and retries it (relies on
    //     the default RETRY_UNKNOWN_ERRORS=true).
    //   - 423 (Locked)   -> throw CancelError so the engine does NOT retry.
    //   - anything else  -> rethrow untouched for the engine's default handling.
    rethrowHubbiError(context, err) {

        const status = err.response && err.response.status;

        if (status === 409) {
            throw new Error(`HubBI conflict (HTTP 409), retrying: ${err.message}`);
        }
        if (status === 423) {
            throw new context.CancelError(`HubBI resource locked (HTTP 423), not retrying: ${err.message}`);
        }
        throw err;
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

    getOutputPortOptions(context, outputType = 'array', itemSchema, { label = 'Records', value = 'result' } = {}) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema).reduce((res, field) => {
                const schema = itemSchema[field];
                const { title: fieldLabel, ...schemaWithoutTitle } = schema;
                res.push({ label: fieldLabel, value: field, schema: schemaWithoutTitle });
                return res;
            }, [
                { label: 'Current Item Index', value: 'index', schema: { type: 'integer', example: 0 } },
                { label: 'Items Count', value: 'count', schema: { type: 'integer', example: 3 } }
            ]);
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
                schema: { type: 'integer', example: 3 }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([{
                label: 'File ID',
                value: 'fileId',
                schema: { type: 'string', example: '5f2a1c8e4b3d2a1908f7e6d5' }
            }], 'out');
        }

        // Without this the function would fall through and return undefined, so
        // the designer's request for the output port options would never be
        // answered and the variable picker would come up empty with nothing
        // explaining why. Mirrors the guard in sendArrayOutput.
        throw new context.CancelError('Unsupported outputType ' + outputType);
    }
};

function toCsv(array) {

    if (!array || array.length === 0) return '';
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(item => {
            return Object.values(item).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property;
            }).join(',');
        })
    ].join('\n');
}
