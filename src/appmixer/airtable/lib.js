'use strict';

module.exports = {

    /**
     * Normalize multiselect input (array or string) to array format for Airtable API.
     * @param {string|string[]} input
     * @param {number} maxItems
     * @param {object} context
     * @param {string} fieldName
     * @returns {string[]}
     */    normalizeMultiselectInput(input, maxItems, context, fieldName) {

        let normalizedInput;

        if (Array.isArray(input)) {
            normalizedInput = input;
        } else if (typeof input === 'string') {
            // Handle comma-separated string
            normalizedInput = input.split(',').map(item => item.trim()).filter(item => item.length > 0);
        } else {
            throw new context.CancelError(`${fieldName} must be a string or an array`);
        }

        if (maxItems !== Infinity && normalizedInput.length > maxItems) {
            throw new context.CancelError(`Cannot have more than ${maxItems} fields selected in ${fieldName}.`);
        }

        return normalizedInput;
    }
};
