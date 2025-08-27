const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/clickup/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('ClickUp lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['completed', 'in progress'];
            const result = normalizeMultiselectInput(input, mockContext, 'statuses');
            assert.deepStrictEqual(result, ['completed', 'in progress']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('single', mockContext, 'statuses'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' single ', mockContext, 'statuses'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('2023:123:1231Z12', mockContext, 'ids'),
                ['2023:123:1231Z12']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('completed,in progress', mockContext, 'statuses'),
                ['completed', 'in progress']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('completed, in progress, to do', mockContext, 'statuses'),
                ['completed', 'in progress', 'to do']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' completed , in progress , to do ', mockContext, 'statuses'),
                ['completed', 'in progress', 'to do']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('completed,,in progress', mockContext, 'statuses'),
                ['completed', 'in progress']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('completed, , in progress', mockContext, 'statuses'),
                ['completed', 'in progress']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'statuses'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'statuses');
            }, /statuses must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'statuses');
            }, /statuses must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'statuses');
            }, /statuses must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'statuses'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('completed,', mockContext, 'statuses'),
                ['completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',completed', mockContext, 'statuses'),
                ['completed']
            );
        });
    });
});
