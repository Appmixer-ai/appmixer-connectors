'use strict';

const pathModule = require('path');

/**
 * Remove undefined/null keys from body object.
 * Preserves falsy values like false, 0, and empty string.
 * @param {Object} body
 * @returns {Object}
 */
const trimUndefined = (body) => {

    const result = {};
    Object.keys(body).forEach(key => {
        if (body[key] !== undefined && body[key] !== null) {
            result[key] = body[key];
        }
    });
    return result;
};

/**
 * Normalize multiselect input (array or string) to array format.
 * Strings are treated as single values or comma-separated lists.
 * @param {string|string[]} input
 * @param {object} context
 * @param {string} fieldName
 * @returns {string[]}
 */
const normalizeMultiselectInput = (input, context, fieldName) => {

    if (Array.isArray(input)) {
        return input;
    } else if (typeof input === 'string') {
        // Handle single string value or comma-separated string
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else {
        throw new context.CancelError(`${fieldName} must be a string or an array`);
    }
};

/**
 * Convert an array of objects to CSV string.
 * @param {Object[]} array
 * @returns {string}
 */
function toCsv(array) {

    if (!array || array.length === 0) return '';
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(item =>
            Object.values(item).map(property => {
                if (typeof property === 'object') return JSON.stringify(property);
                return property;
            }).join(',')
        )
    ].join('\n');
}

/**
 * Send output based on outputType ('first', 'object', 'array', 'file').
 * @param {Object} opts
 * @param {Object} opts.context - Appmixer component context
 * @param {Object[]} opts.records - array of records to output
 * @param {string} opts.outputType - 'first' | 'object' | 'array' | 'file'
 * @param {string} opts.defaultPrefix - filename prefix used for file output
 */
async function sendArrayOutput({ context, records, outputType, defaultPrefix = 'freshdesk-export' }) {

    if (outputType === 'first') {
        if (records.length === 0) {
            throw new context.CancelError('No records available for first output type');
        }
        await context.sendJson(
            { ...records[0], index: 0, count: records.length },
            'out'
        );
    } else if (outputType === 'object') {
        for (let index = 0; index < records.length; index++) {
            await context.sendJson(
                { ...records[index], index, count: records.length },
                'out'
            );
        }
    } else if (outputType === 'array') {
        await context.sendJson({ result: records, count: records.length }, 'out');
    } else if (outputType === 'file') {
        const csvString = toCsv(records);
        const buffer = Buffer.from(csvString, 'utf8');
        const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
        const fileName = `${context.config.outputFilePrefix || defaultPrefix}-${componentName}.csv`;
        const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
        await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
        await context.sendJson({ fileId: savedFile.fileId }, 'out');
    } else {
        throw new context.CancelError('Unsupported outputType ' + outputType);
    }
}

module.exports = {
    trimUndefined,
    normalizeMultiselectInput,
    toCsv,
    sendArrayOutput
};
