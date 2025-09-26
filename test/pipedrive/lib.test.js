const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/pipedrive/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Pipedrive lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['custom_fields', 'notes'];
            const result = normalizeMultiselectInput(input, mockContext, 'fields');
            assert.deepStrictEqual(result, ['custom_fields', 'notes']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields', mockContext, 'fields'),
                ['custom_fields']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' notes ', mockContext, 'fields'),
                ['notes']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('title', mockContext, 'fields'),
                ['title']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields,notes', mockContext, 'fields'),
                ['custom_fields', 'notes']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields, notes, title', mockContext, 'fields'),
                ['custom_fields', 'notes', 'title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' custom_fields , notes , title ', mockContext, 'fields'),
                ['custom_fields', 'notes', 'title']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields,,notes', mockContext, 'fields'),
                ['custom_fields', 'notes']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields, , notes', mockContext, 'fields'),
                ['custom_fields', 'notes']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'fields'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'fields');
            }, /fields must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'fields');
            }, /fields must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'fields');
            }, /fields must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'fields'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields,', mockContext, 'fields'),
                ['custom_fields']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',notes', mockContext, 'fields'),
                ['notes']
            );
        });
    });
});
