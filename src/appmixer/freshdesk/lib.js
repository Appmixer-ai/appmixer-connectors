'use strict';

/**
 * Remove undefined keys from body object
 * @param {Object} body
 * @returns {Object}
 */
const trimUndefined = (body) => {

    const result = {};
    Object.keys(body).forEach(key => {
        if (body[key]) {
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

module.exports = {
    trimUndefined,
    normalizeMultiselectInput
};
