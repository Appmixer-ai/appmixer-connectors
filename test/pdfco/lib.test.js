const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/pdfco/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('PDFco lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['Checkbox', 'Rectangle'];
            const result = normalizeMultiselectInput(input, mockContext, 'types');
            assert.deepStrictEqual(result, ['Checkbox', 'Rectangle']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('Checkbox', mockContext, 'types'),
                ['Checkbox']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' Rectangle ', mockContext, 'types'),
                ['Rectangle']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('UnderlinedField', mockContext, 'types'),
                ['UnderlinedField']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('Checkbox,Rectangle', mockContext, 'types'),
                ['Checkbox', 'Rectangle']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('Checkbox, Rectangle, Oval', mockContext, 'types'),
                ['Checkbox', 'Rectangle', 'Oval']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' Checkbox , Rectangle , Oval ', mockContext, 'types'),
                ['Checkbox', 'Rectangle', 'Oval']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('Checkbox,,Rectangle', mockContext, 'types'),
                ['Checkbox', 'Rectangle']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('Checkbox, , Rectangle', mockContext, 'types'),
                ['Checkbox', 'Rectangle']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'types'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'types');
            }, /types must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'types');
            }, /types must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'types');
            }, /types must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'types'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('Checkbox,', mockContext, 'types'),
                ['Checkbox']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',Rectangle', mockContext, 'types'),
                ['Rectangle']
            );
        });
    });
});
