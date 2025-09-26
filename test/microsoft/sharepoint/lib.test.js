const assert = require('assert');
const { normalizeMultiselectInput } = require('../../../src/appmixer/microsoft/sharepoint/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Microsoft SharePoint lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['image/', 'video/'];
            const result = normalizeMultiselectInput(input, mockContext, 'fileTypesRestriction');
            assert.deepStrictEqual(result, ['image/', 'video/']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('image/', mockContext, 'fileTypesRestriction'),
                ['image/']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' text/ ', mockContext, 'fileTypesRestriction'),
                ['text/']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('application/pdf', mockContext, 'fileTypesRestriction'),
                ['application/pdf']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('image/,video/', mockContext, 'fileTypesRestriction'),
                ['image/', 'video/']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('image/, video/, audio/', mockContext, 'fileTypesRestriction'),
                ['image/', 'video/', 'audio/']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' image/ , video/ , audio/ ', mockContext, 'fileTypesRestriction'),
                ['image/', 'video/', 'audio/']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('image/,,video/', mockContext, 'fileTypesRestriction'),
                ['image/', 'video/']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('image/, , video/', mockContext, 'fileTypesRestriction'),
                ['image/', 'video/']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'fileTypesRestriction'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'fileTypesRestriction');
            }, /fileTypesRestriction must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'fileTypesRestriction');
            }, /fileTypesRestriction must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'fileTypesRestriction');
            }, /fileTypesRestriction must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'fileTypesRestriction'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('image/,', mockContext, 'fileTypesRestriction'),
                ['image/']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',video/', mockContext, 'fileTypesRestriction'),
                ['video/']
            );
        });
    });
});
