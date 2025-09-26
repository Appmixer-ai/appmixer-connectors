const assert = require('assert');
const { normalizeMultiselectInput } = require('../../../src/appmixer/microsoft/mail/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Microsoft Mail lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['value1', 'value2'];
            const result = normalizeMultiselectInput(input, mockContext, 'categories');
            assert.deepStrictEqual(result, ['value1', 'value2']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('single', mockContext, 'categories'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' single ', mockContext, 'categories'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('Blue category', mockContext, 'categories'),
                ['Blue category']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1,value2', mockContext, 'categories'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1, value2, value3', mockContext, 'categories'),
                ['value1', 'value2', 'value3']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' value1 , value2 , value3 ', mockContext, 'categories'),
                ['value1', 'value2', 'value3']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1,,value2', mockContext, 'categories'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1, , value2', mockContext, 'categories'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'categories'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'categories');
            }, /categories must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'categories');
            }, /categories must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'categories');
            }, /categories must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'categories'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value,', mockContext, 'categories'),
                ['value']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',value', mockContext, 'categories'),
                ['value']
            );
        });
    });
});
