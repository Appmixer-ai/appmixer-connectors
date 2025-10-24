const assert = require('assert');

describe('lib.js', () => {

    describe('normalizeMultiselectInput', () => {

        const context = { CancelError: class CancelError extends Error {} };

        it('should return array as-is when input is already an array', () => {
            const input = ['completed', 'in progress'];
            const result = require('../../lib').normalizeMultiselectInput(input, context, 'statuses');
            assert.deepStrictEqual(result, ['completed', 'in progress']);
            assert.strictEqual(result, input);
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('single', context, 'statuses'),
                ['single']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(' single ', context, 'statuses'),
                ['single']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('2023:123:1231Z12', context, 'ids'),
                ['2023:123:1231Z12']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('completed,in progress', context, 'statuses'),
                ['completed', 'in progress']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('completed, in progress, to do', context, 'statuses'),
                ['completed', 'in progress', 'to do']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(' completed , in progress , to do ', context, 'statuses'),
                ['completed', 'in progress', 'to do']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('completed,,in progress', context, 'statuses'),
                ['completed', 'in progress']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('completed, , in progress', context, 'statuses'),
                ['completed', 'in progress']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(',', context, 'statuses'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(123, context, 'statuses');
            }, /statuses must be a string or an array/);

            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(true, context, 'statuses');
            }, /statuses must be a string or an array/);

            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(null, context, 'statuses');
            }, /statuses must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('   ', context, 'statuses'),
                []
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('completed,', context, 'statuses'),
                ['completed']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(',completed', context, 'statuses'),
                ['completed']
            );
        });
    });
});
