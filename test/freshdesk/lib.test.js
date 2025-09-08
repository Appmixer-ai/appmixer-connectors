const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/freshdesk/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Freshdesk lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['conversations', 'requester'];
            const result = normalizeMultiselectInput(input, mockContext, 'embed');
            assert.deepStrictEqual(result, ['conversations', 'requester']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('conversations', mockContext, 'embed'),
                ['conversations']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' requester ', mockContext, 'embed'),
                ['requester']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('company', mockContext, 'embed'),
                ['company']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('conversations,requester', mockContext, 'embed'),
                ['conversations', 'requester']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('conversations, requester, company', mockContext, 'embed'),
                ['conversations', 'requester', 'company']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' conversations , requester , stats ', mockContext, 'embed'),
                ['conversations', 'requester', 'stats']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('conversations,,requester', mockContext, 'embed'),
                ['conversations', 'requester']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('conversations, , requester', mockContext, 'embed'),
                ['conversations', 'requester']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'embed'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'embed');
            }, /embed must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'embed');
            }, /embed must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'embed');
            }, /embed must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'embed'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('conversations,', mockContext, 'embed'),
                ['conversations']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',conversations', mockContext, 'embed'),
                ['conversations']
            );
        });
    });
});
