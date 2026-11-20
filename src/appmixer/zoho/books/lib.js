'use strict';

const pathModule = require('path');
const moment = require('moment');

const DEFAULT_PREFIX = 'zoho-books-export';

// Zoho Books lists at most 200 records per page.
const PAGE_SIZE = 200;

/**
 * Zoho Books returns timestamps as '2026-06-20T10:30:00+0000' - the offset has no colon.
 * @param {string} value
 * @returns {number} epoch ms, 0 when the value is missing or unparsable
 */
function parseTime(value) {

    const normalized = String(value || '').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
    const time = Date.parse(normalized);
    return Number.isNaN(time) ? 0 : time;
}

/**
 * Formats epoch ms as the timestamp Zoho Books uses in its filters and responses
 * ('2026-06-20T10:30:00+0000').
 * @param {number} time
 * @returns {string}
 */
function formatTime(time) {

    return moment.utc(time).format('YYYY-MM-DDTHH:mm:ss[+0000]');
}

/**
 * Formats a date as the plain `YYYY-MM-DD` Zoho Books expects. A string keeps the calendar day it
 * was written with: the date-time inspector sends the user's local midnight with an offset
 * (2026-09-14T00:00:00+02:00), and converting that to UTC first would shift it to the previous day.
 * @param {string|Date} date
 * @returns {string|undefined}
 */
function formatDate(date) {

    if (date === undefined || date === null || date === '') {
        return undefined;
    }
    if (typeof date === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        const parsed = moment.parseZone(date, moment.ISO_8601);
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM-DD');
        }
    }
    return moment.utc(date).format('YYYY-MM-DD');
}

/**
 * Parses an input that carries a JSON array or object typed into a text field. Values coming
 * from a variable may already be parsed.
 * @param {*} context
 * @param {*} value
 * @param {string} label Input label used in the error message.
 * @returns {*} undefined when the input is empty
 */
function parseJsonInput(context, value, label) {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (typeof value !== 'string') {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (err) {
        throw new context.CancelError(`${label} must be valid JSON.`);
    }
}

/**
 * Copies the inputs that are set (not undefined, null or '') into a request body or query. Inputs
 * are camelCase, the Zoho Books API fields snake_case: the API field `customer_id` is read from
 * the input `customerId`.
 * @param {Object} input
 * @param {Array<string>} keys API field names
 * @returns {Object}
 */
function pickDefined(input, keys) {

    return keys.reduce((body, key) => {
        const value = input[key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())];
        if (value !== undefined && value !== null && value !== '') {
            body[key] = value;
        }
        return body;
    }, {});
}

// Every cell is quoted so values containing commas, quotes or newlines (notes, addresses, JSON of
// nested fields) cannot shift columns or rows. Cells are read by header, not by position, because
// Zoho omits empty fields per record.
const toCsv = (array) => {

    if (!array || !array.length) {
        return '';
    }
    const headers = Object.keys(array[0]);
    const escapeCell = (value) => {
        const text = value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
        return `"${text.replace(/"/g, '""')}"`;
    };
    return [
        headers.map(escapeCell).join(','),
        ...array.map(item => headers.map(header => escapeCell(item[header])).join(','))
    ].join('\n');
};

module.exports = {

    PAGE_SIZE,
    parseTime,
    formatTime,
    formatDate,
    parseJsonInput,
    pickDefined,

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

        throw new context.CancelError('Unsupported outputType ' + outputType);
    }
};
