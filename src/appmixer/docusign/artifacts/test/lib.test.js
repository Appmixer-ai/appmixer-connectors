const assert = require('assert');

describe('lib.js', () => {

    describe('normalizeMultiselectInput', () => {

        const context = { CancelError: class CancelError extends Error {} };

        it('should return array as-is when input is already an array', () => {
            const input = ['envelope-sent', 'envelope-completed'];
            const result = require('../../lib').normalizeMultiselectInput(input, context, 'events');
            assert.deepStrictEqual(result, ['envelope-sent', 'envelope-completed']);
            assert.strictEqual(result, input);
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('envelope-sent', context, 'events'),
                ['envelope-sent']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(' envelope-sent ', context, 'events'),
                ['envelope-sent']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('custom_fields', context, 'include'),
                ['custom_fields']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('envelope-sent,envelope-completed', context, 'events'),
                ['envelope-sent', 'envelope-completed']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('custom_fields, documents, recipients', context, 'include'),
                ['custom_fields', 'documents', 'recipients']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(' envelope-sent , envelope-completed , envelope-voided ', context, 'events'),
                ['envelope-sent', 'envelope-completed', 'envelope-voided']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('envelope-sent,,envelope-completed', context, 'events'),
                ['envelope-sent', 'envelope-completed']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('envelope-sent, , envelope-completed', context, 'events'),
                ['envelope-sent', 'envelope-completed']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(',', context, 'events'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(123, context, 'events');
            }, /events must be a string or an array/);

            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(true, context, 'events');
            }, /events must be a string or an array/);

            assert.throws(() => {
                require('../../lib').normalizeMultiselectInput(null, context, 'events');
            }, /events must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('   ', context, 'events'),
                []
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput('envelope-sent,', context, 'events'),
                ['envelope-sent']
            );
            assert.deepStrictEqual(
                require('../../lib').normalizeMultiselectInput(',envelope-sent', context, 'events'),
                ['envelope-sent']
            );
        });
    });
});
