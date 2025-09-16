const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/googleSlides/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('GoogleSlides lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['presentationId', 'title', 'slides'];
            const result = normalizeMultiselectInput(input, mockContext, 'fields');
            assert.deepStrictEqual(result, ['presentationId', 'title', 'slides']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('title', mockContext, 'fields'),
                ['title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' presentationId ', mockContext, 'fields'),
                ['presentationId']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId,title', mockContext, 'fields'),
                ['presentationId', 'title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId, title, slides', mockContext, 'fields'),
                ['presentationId', 'title', 'slides']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' presentationId , title , slides ', mockContext, 'fields'),
                ['presentationId', 'title', 'slides']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId,,title', mockContext, 'fields'),
                ['presentationId', 'title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId, , title', mockContext, 'fields'),
                ['presentationId', 'title']
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
                normalizeMultiselectInput('title,', mockContext, 'fields'),
                ['title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',title', mockContext, 'fields'),
                ['title']
            );
        });
    });
});
