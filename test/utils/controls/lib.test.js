const assert = require('assert');
const { normalizeMultiselectInput } = require('../../../src/appmixer/utils/controls/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Utils Controls lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['one', 'two'];
            const result = normalizeMultiselectInput(input, mockContext, 'multiselect');
            assert.deepStrictEqual(result, ['one', 'two']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('one', mockContext, 'multiselect'),
                ['one']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' two ', mockContext, 'multiselect'),
                ['two']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('three', mockContext, 'multiselect'),
                ['three']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('one,two', mockContext, 'multiselect'),
                ['one', 'two']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('one, two, three', mockContext, 'multiselect'),
                ['one', 'two', 'three']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' one , two , three ', mockContext, 'multiselect'),
                ['one', 'two', 'three']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('one,,two', mockContext, 'multiselect'),
                ['one', 'two']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('one, , two', mockContext, 'multiselect'),
                ['one', 'two']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'multiselect'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'multiselect');
            }, /multiselect must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'multiselect');
            }, /multiselect must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'multiselect');
            }, /multiselect must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'multiselect'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('one,', mockContext, 'multiselect'),
                ['one']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',two', mockContext, 'multiselect'),
                ['two']
            );
        });
    });
});
