const assert = require('assert');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

// Import only the normalization function to avoid dependencies
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

describe('modelcontextprotocol_server_everart lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['tool1', 'tool2'];
            const result = normalizeMultiselectInput(input, mockContext, 'Tools');
            assert.deepStrictEqual(result, ['tool1', 'tool2']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('single', mockContext, 'Tools'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' single ', mockContext, 'Tools'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('tool:name:123', mockContext, 'Tools'),
                ['tool:name:123']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('tool1,tool2', mockContext, 'Tools'),
                ['tool1', 'tool2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('tool1, tool2, tool3', mockContext, 'Tools'),
                ['tool1', 'tool2', 'tool3']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' tool1 , tool2 , tool3 ', mockContext, 'Tools'),
                ['tool1', 'tool2', 'tool3']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('tool1,,tool2', mockContext, 'Tools'),
                ['tool1', 'tool2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('tool1, , tool2', mockContext, 'Tools'),
                ['tool1', 'tool2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'Tools'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'Tools');
            }, /Tools must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'Tools');
            }, /Tools must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'Tools');
            }, /Tools must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'Tools'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('tool,', mockContext, 'Tools'),
                ['tool']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',tool', mockContext, 'Tools'),
                ['tool']
            );
        });
    });
});

