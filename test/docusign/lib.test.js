const assert = require('assert');

// Extract just the normalizeMultiselectInput function for testing
const normalizeMultiselectInput = (input, context, fieldName) => {
    if (Array.isArray(input)) {
        return input;
    } else if (typeof input === 'string') {
        // Handle single string value or comma-separated string
        return input.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } else {
        throw new context.CancelError(`${fieldName} must be a string or an array`);
    }
};

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Docusign lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['envelope-sent', 'envelope-completed'];
            const result = normalizeMultiselectInput(input, mockContext, 'events');
            assert.deepStrictEqual(result, ['envelope-sent', 'envelope-completed']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('envelope-sent', mockContext, 'events'),
                ['envelope-sent']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' envelope-sent ', mockContext, 'events'),
                ['envelope-sent']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields', mockContext, 'include'),
                ['custom_fields']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('envelope-sent,envelope-completed', mockContext, 'events'),
                ['envelope-sent', 'envelope-completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('custom_fields, documents, recipients', mockContext, 'include'),
                ['custom_fields', 'documents', 'recipients']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' envelope-sent , envelope-completed , envelope-voided ', mockContext, 'events'),
                ['envelope-sent', 'envelope-completed', 'envelope-voided']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('envelope-sent,,envelope-completed', mockContext, 'events'),
                ['envelope-sent', 'envelope-completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('envelope-sent, , envelope-completed', mockContext, 'events'),
                ['envelope-sent', 'envelope-completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'events'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'events');
            }, /events must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'events');
            }, /events must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'events');
            }, /events must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'events'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('envelope-sent,', mockContext, 'events'),
                ['envelope-sent']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',envelope-sent', mockContext, 'events'),
                ['envelope-sent']
            );
        });
    });
});
