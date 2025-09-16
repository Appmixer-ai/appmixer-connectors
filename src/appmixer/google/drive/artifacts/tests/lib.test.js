const assert = require('assert');
const sinon = require('sinon');

describe('google.drive.lib', () => {

    let lib;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Clear require cache first
        delete require.cache[require.resolve('../../lib')];

        // Now require the lib
        lib = require('../../lib');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#normalizeMultiselectInput', () => {

        it('should return empty array for null input', () => {
            const result = lib.normalizeMultiselectInput(null);
            assert.deepStrictEqual(result, []);
        });

        it('should return empty array for undefined input', () => {
            const result = lib.normalizeMultiselectInput(undefined);
            assert.deepStrictEqual(result, []);
        });

        it('should return empty array for empty string input', () => {
            const result = lib.normalizeMultiselectInput('');
            assert.deepStrictEqual(result, []);
        });

        it('should return the same array for array input', () => {
            const input = ['value1', 'value2', 'value3'];
            const result = lib.normalizeMultiselectInput(input);
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should split comma-separated string into array', () => {
            const result = lib.normalizeMultiselectInput('value1,value2,value3');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should trim whitespace from comma-separated values', () => {
            const result = lib.normalizeMultiselectInput('  value1  ,  value2  ,  value3  ');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should filter out empty values from comma-separated string', () => {
            const result = lib.normalizeMultiselectInput('value1,,value2,   ,value3');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should handle single value string', () => {
            const result = lib.normalizeMultiselectInput('singlevalue');
            assert.deepStrictEqual(result, ['singlevalue']);
        });

        it('should throw error for invalid input type', () => {
            assert.throws(
                () => lib.normalizeMultiselectInput(123),
                /Invalid input type for multiselect field. Expected string or array./);
            assert.throws(
                () => lib.normalizeMultiselectInput({}),
                /Invalid input type for multiselect field. Expected string or array./);
            assert.throws(
                () => lib.normalizeMultiselectInput(true),
                /Invalid input type for multiselect field. Expected string or array./);
        });

    });

});
