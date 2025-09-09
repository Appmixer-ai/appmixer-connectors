const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/smartsheet/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Smartsheet lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return comma-separated string when input is already an array', () => {
            const input = ['value1', 'value2'];
            const result = normalizeMultiselectInput(input, mockContext, 'include');
            assert.strictEqual(result, 'value1,value2');
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.strictEqual(
                normalizeMultiselectInput('single', mockContext, 'include'),
                'single'
            );
            assert.strictEqual(
                normalizeMultiselectInput(' single ', mockContext, 'include'),
                'single'
            );
            assert.strictEqual(
                normalizeMultiselectInput('attachments', mockContext, 'include'),
                'attachments'
            );

            // Comma-separated values
            assert.strictEqual(
                normalizeMultiselectInput('value1,value2', mockContext, 'include'),
                'value1,value2'
            );
            assert.strictEqual(
                normalizeMultiselectInput('value1, value2, value3', mockContext, 'include'),
                'value1,value2,value3'
            );
            assert.strictEqual(
                normalizeMultiselectInput(' value1 , value2 , value3 ', mockContext, 'include'),
                'value1,value2,value3'
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.strictEqual(
                normalizeMultiselectInput('value1,,value2', mockContext, 'include'),
                'value1,value2'
            );
            assert.strictEqual(
                normalizeMultiselectInput('value1, , value2', mockContext, 'include'),
                'value1,value2'
            );
            assert.strictEqual(
                normalizeMultiselectInput(',', mockContext, 'include'),
                ''
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'include');
            }, /include must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'include');
            }, /include must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'include');
            }, /include must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.strictEqual(
                normalizeMultiselectInput('   ', mockContext, 'include'),
                ''
            );
            assert.strictEqual(
                normalizeMultiselectInput('value,', mockContext, 'include'),
                'value'
            );
            assert.strictEqual(
                normalizeMultiselectInput(',value', mockContext, 'include'),
                'value'
            );
        });

        it('should handle Smartsheet specific multiselect values', () => {
            // Test with Smartsheet include options
            assert.strictEqual(
                normalizeMultiselectInput(['attachments', 'data', 'discussions'], mockContext, 'include'),
                'attachments,data,discussions'
            );
            assert.strictEqual(
                normalizeMultiselectInput('attachments,data,discussions', mockContext, 'include'),
                'attachments,data,discussions'
            );

            // Test with skipRemap options
            assert.strictEqual(
                normalizeMultiselectInput(['cellLinks', 'reports'], mockContext, 'skipRemap'),
                'cellLinks,reports'
            );
            assert.strictEqual(
                normalizeMultiselectInput('cellLinks, reports', mockContext, 'skipRemap'),
                'cellLinks,reports'
            );
        });
    });
});
