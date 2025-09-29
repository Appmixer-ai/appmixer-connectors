const assert = require('assert');
const { normalizeMultiselectInput } = require('../../../src/appmixer/utils/timers/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Utils Timers lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['monday', 'tuesday'];
            const result = normalizeMultiselectInput(input, mockContext, 'daysOfWeek');
            assert.deepStrictEqual(result, ['monday', 'tuesday']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('monday', mockContext, 'daysOfWeek'),
                ['monday']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' friday ', mockContext, 'daysOfWeek'),
                ['friday']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('last day of the month', mockContext, 'daysOfMonth'),
                ['last day of the month']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('monday,tuesday', mockContext, 'daysOfWeek'),
                ['monday', 'tuesday']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('1, 15, 30', mockContext, 'daysOfMonth'),
                ['1', '15', '30']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' monday , wednesday , friday ', mockContext, 'daysOfWeek'),
                ['monday', 'wednesday', 'friday']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('monday,,wednesday', mockContext, 'daysOfWeek'),
                ['monday', 'wednesday']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('1, , 15', mockContext, 'daysOfMonth'),
                ['1', '15']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'daysOfWeek'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'daysOfWeek');
            }, /daysOfWeek must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'daysOfMonth');
            }, /daysOfMonth must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'daysOfWeek');
            }, /daysOfWeek must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'daysOfWeek'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('monday,', mockContext, 'daysOfWeek'),
                ['monday']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',15', mockContext, 'daysOfMonth'),
                ['15']
            );
        });
    });
});
