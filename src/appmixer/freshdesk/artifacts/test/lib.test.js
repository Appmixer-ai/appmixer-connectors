const assert = require('assert');

describe('lib.js', () => {

    describe('normalizeMultiselectInput', () => {

        const context = { CancelError: class CancelError extends Error {} };

        it('should return array as-is when input is already an array', () => {
            const input = ['conversations', 'requester'];
            const result = require('../../lib').normalizeMultiselectInput(input, context, 'embed');
            assert.deepStrictEqual(result, ['conversations', 'requester']);
            assert.strictEqual(result, input);
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('conversations', context, 'embed'),
                ['conversations']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(' requester ', context, 'embed'),
                ['requester']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('company', context, 'embed'),
                ['company']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('conversations,requester', context, 'embed'),
                ['conversations', 'requester']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('conversations, requester, company', context, 'embed'),
                ['conversations', 'requester', 'company']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(' conversations , requester , stats ', context, 'embed'),
                ['conversations', 'requester', 'stats']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('conversations,,requester', context, 'embed'),
                ['conversations', 'requester']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('conversations, , requester', context, 'embed'),
                ['conversations', 'requester']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(',', context, 'embed'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(123, context, 'embed');
            }, /embed must be a string or an array/);

            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(true, context, 'embed');
            }, /embed must be a string or an array/);

            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(null, context, 'embed');
            }, /embed must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('   ', context, 'embed'),
                []
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('conversations,', context, 'embed'),
                ['conversations']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(',conversations', context, 'embed'),
                ['conversations']
            );
        });
    });
});
