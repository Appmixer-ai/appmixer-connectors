'use strict';

const pathModule = require('path');

const DEFAULT_PREFIX = 'airtop-objects-export';

const BASE_URL = 'https://api.airtop.ai/api/v1';

// `meta.status` of an AI operation is one of success | partial | failure. `partial`
// still carries a usable payload, so it is accepted and only the failure - and any
// undocumented value - stops the flow.
const AI_SUCCESS_STATUSES = ['success', 'partial'];

module.exports = {

    BASE_URL,

    /**
     * Build the auth headers required by the Airtop REST API.
     * @param {object} context
     * @returns {object}
     */
    authHeaders(context) {
        return {
            'Authorization': `Bearer ${context.auth.apiKey}`
        };
    },

    /**
     * Perform an authorized request against the Airtop API.
     * @param {object} context
     * @param {object} options - method, path (relative to BASE_URL), data, params
     * @returns {Promise<object>} the axios-like response
     */
    async apiRequest(context, { method = 'GET', path, data, params } = {}) {

        const requestOptions = {
            method,
            url: `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`,
            headers: {
                ...module.exports.authHeaders(context),
                'Content-Type': 'application/json'
            }
        };

        if (data !== undefined) {
            requestOptions.data = data;
        }
        if (params !== undefined) {
            requestOptions.params = params;
        }

        return context.httpRequest(requestOptions);
    },

    /**
     * Airtop wraps successful payloads in a `data` envelope and reports
     * non-fatal problems in `errors` / `warnings`. A populated `errors` array
     * becomes a CancelError so the flow stops with a clear message instead of
     * emitting an empty result; `warnings` are logged and the call continues.
     * @param {object} context
     * @param {object} responseData - the parsed response body
     * @returns {object}
     */
    unwrap(context, responseData) {

        const body = responseData || {};

        if (Array.isArray(body.errors) && body.errors.length) {
            throw new context.CancelError(`Airtop API error: ${describeIssues(body.errors)}`);
        }

        if (Array.isArray(body.warnings) && body.warnings.length) {
            // Non-fatal: surface them in the flow log without stopping the flow. Logging
            // is best-effort here because `unwrap` is synchronous and its callers only
            // care about the payload.
            Promise.resolve(
                context.log({ step: 'Airtop API warning', warnings: describeIssues(body.warnings) })
            ).catch(() => {});
        }

        return body.data !== undefined ? body.data : body;
    },

    /**
     * Normalize the response of an Airtop AI operation (page-query, click, type,
     * screenshot, ...). Those endpoints answer 2xx even when the operation failed,
     * so `meta.status` is the real success signal.
     * @param {object} context
     * @param {object} responseData - the parsed response body
     * @returns {object} { modelResponse, status, requestId, credits, screenshots }
     */
    aiResult(context, responseData) {

        const body = responseData || {};
        const meta = body.meta || {};
        const data = module.exports.unwrap(context, body);

        // Allowlist, not a denylist. Airtop documents exactly three outcomes -
        // success, partial, failure - and marks `meta.status` required. A missing or
        // unexpected status therefore means we cannot tell the operation succeeded, and
        // every field below would be emitted as `undefined` on the `out` port. Fail
        // closed on anything that is not a documented success.
        if (!AI_SUCCESS_STATUSES.includes(meta.status)) {
            throw new context.CancelError('The Airtop operation did not succeed (status: '
                + (meta.status || 'unknown') + '). Request ID: '
                + (meta.requestId || 'unknown') + '.');
        }

        return {
            modelResponse: data.modelResponse,
            status: meta.status,
            requestId: meta.requestId,
            credits: (meta.usage || {}).credits,
            screenshots: meta.screenshots || []
        };
    },

    /**
     * Parse a JSON string coming from a textarea inspector input.
     * @param {object} context
     * @param {*} value
     * @param {string} label
     * @returns {object|undefined}
     */
    parseJsonInput(context, value, label) {

        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value === 'object') {
            return value;
        }
        try {
            return JSON.parse(value);
        } catch (err) {
            throw new context.CancelError(`${label} must be a valid JSON object.`);
        }
    },

    /**
     * Convert the rows produced by the key-value inspector input into a plain object.
     * The inspector may hand over an array, an `{ ADD: [...] }` wrapper or — when the
     * value is bound from another component — the JSON string of either shape.
     * @param {array|object|string} rows
     * @returns {object}
     */
    keyValueToObject(rows) {

        let value = rows;

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed.length) {
                return {};
            }
            try {
                value = JSON.parse(trimmed);
            } catch (err) {
                return {};
            }
        }

        const list = Array.isArray(value) ? value : (value && Array.isArray(value.ADD) ? value.ADD : null);
        const out = {};

        if (!list) {
            return out;
        }

        for (const row of list) {
            if (!row || typeof row !== 'object') continue;
            if (typeof row.key !== 'string' || row.key.length === 0) continue;
            out[row.key] = row.value;
        }

        return out;
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
            // Just the first one.
            await context.sendJson(
                { ...records[0], index: 0, count: records.length },
                outputPortName
            );
        } else if (outputType === 'object') {
            // One by one.
            for (let index = 0; index < records.length; index++) {
                await context.sendJson(
                    { ...records[index], index, count: records.length },
                    outputPortName
                );
            }
        } else if (outputType === 'array') {
            // All at once.
            await context.sendJson({ result: records, count: records.length }, outputPortName);
        } else if (outputType === 'file') {

            // Into CSV file.
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

    getOutputPortOptions(context, outputType, itemSchema, { label }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: label, ...schemaWithoutTitle } = schema;

                    res.push({
                        label, value: field, schema: schemaWithoutTitle
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

/**
 * Render an Airtop `errors` / `warnings` array as a single readable string.
 * @param {array} issues
 * @returns {string}
 */
const describeIssues = (issues) => {

    return issues
        .map(issue => (issue && (issue.message || issue.reason || issue.code)) || String(issue))
        .join('; ');
};

/**
 * @param {array} array
 * @returns {string}
 */
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
