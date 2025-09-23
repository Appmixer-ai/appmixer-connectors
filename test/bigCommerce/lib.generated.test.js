const assert = require('assert');
const lib = require('../../src/appmixer/bigCommerce/lib.generated');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('BigCommerce lib.generated', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['value1', 'value2'];
            const result = lib.normalizeMultiselectInput(input, mockContext, 'categories');
            assert.deepStrictEqual(result, ['value1', 'value2']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('single', mockContext, 'categories'),
                ['single']
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput(' single ', mockContext, 'categories'),
                ['single']
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('123', mockContext, 'categories'),
                ['123']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('value1,value2', mockContext, 'categories'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('value1, value2, value3', mockContext, 'categories'),
                ['value1', 'value2', 'value3']
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput(' value1 , value2 , value3 ', mockContext, 'categories'),
                ['value1', 'value2', 'value3']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('value1,,value2', mockContext, 'categories'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('value1, , value2', mockContext, 'categories'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput(',', mockContext, 'categories'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                lib.normalizeMultiselectInput(123, mockContext, 'categories');
            }, /categories must be a string or an array/);

            assert.throws(() => {
                lib.normalizeMultiselectInput(true, mockContext, 'categories');
            }, /categories must be a string or an array/);

            assert.throws(() => {
                lib.normalizeMultiselectInput(null, mockContext, 'categories');
            }, /categories must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('   ', mockContext, 'categories'),
                []
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput('value,', mockContext, 'categories'),
                ['value']
            );
            assert.deepStrictEqual(
                lib.normalizeMultiselectInput(',value', mockContext, 'categories'),
                ['value']
            );
        });
    });
});
