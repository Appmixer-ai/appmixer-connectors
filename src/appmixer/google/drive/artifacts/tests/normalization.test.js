const assert = require('assert');

/**
 * Normalizes multiselect input to ensure it's always an array.
 * @param {string|Array} input - The input value from a multiselect field
 * @returns {Array} An array of values
 */
const normalizeMultiselectInput = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
        return input.split(',').map(item => item.trim()).filter(item => item);
    }
    throw new Error('Invalid input type for multiselect field. Expected string or array.');
};

describe('google.drive.lib', () => {

    describe('#normalizeMultiselectInput', () => {

        it('should return empty array for null input', () => {
            const result = normalizeMultiselectInput(null);
            assert.deepStrictEqual(result, []);
        });

        it('should return empty array for undefined input', () => {
            const result = normalizeMultiselectInput(undefined);
            assert.deepStrictEqual(result, []);
        });

        it('should return empty array for empty string input', () => {
            const result = normalizeMultiselectInput('');
            assert.deepStrictEqual(result, []);
        });

        it('should return the same array for array input', () => {
            const input = ['value1', 'value2', 'value3'];
            const result = normalizeMultiselectInput(input);
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should split comma-separated string into array', () => {
            const result = normalizeMultiselectInput('value1,value2,value3');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should trim whitespace from comma-separated values', () => {
            const result = normalizeMultiselectInput('  value1  ,  value2  ,  value3  ');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should filter out empty values from comma-separated string', () => {
            const result = normalizeMultiselectInput('value1,,value2,   ,value3');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should handle single value string', () => {
            const result = normalizeMultiselectInput('singlevalue');
            assert.deepStrictEqual(result, ['singlevalue']);
        });

        it('should throw error for invalid input type', () => {
            assert.throws(
                () => normalizeMultiselectInput(123),
                /Invalid input type for multiselect field. Expected string or array./);
            assert.throws(
                () => normalizeMultiselectInput({}),
                /Invalid input type for multiselect field. Expected string or array./);
            assert.throws(
                () => normalizeMultiselectInput(true),
                /Invalid input type for multiselect field. Expected string or array./);
        });

    });

});
