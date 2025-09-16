const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/googleChat/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('GoogleChat lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['SPACE', 'GROUP_CHAT'];
            const result = normalizeMultiselectInput(input, mockContext, 'spaceTypes');
            assert.deepStrictEqual(result, ['SPACE', 'GROUP_CHAT']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('SPACE', mockContext, 'spaceTypes'),
                ['SPACE']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' GROUP_CHAT ', mockContext, 'spaceTypes'),
                ['GROUP_CHAT']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('DIRECT_MESSAGE', mockContext, 'spaceTypes'),
                ['DIRECT_MESSAGE']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('SPACE,GROUP_CHAT', mockContext, 'spaceTypes'),
                ['SPACE', 'GROUP_CHAT']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('SPACE, GROUP_CHAT, DIRECT_MESSAGE', mockContext, 'spaceTypes'),
                ['SPACE', 'GROUP_CHAT', 'DIRECT_MESSAGE']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' SPACE , GROUP_CHAT , DIRECT_MESSAGE ', mockContext, 'spaceTypes'),
                ['SPACE', 'GROUP_CHAT', 'DIRECT_MESSAGE']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('SPACE,,GROUP_CHAT', mockContext, 'spaceTypes'),
                ['SPACE', 'GROUP_CHAT']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('SPACE, , GROUP_CHAT', mockContext, 'spaceTypes'),
                ['SPACE', 'GROUP_CHAT']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'spaceTypes'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'spaceTypes');
            }, /spaceTypes must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'spaceTypes');
            }, /spaceTypes must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'spaceTypes');
            }, /spaceTypes must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'spaceTypes'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('SPACE,', mockContext, 'spaceTypes'),
                ['SPACE']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',SPACE', mockContext, 'spaceTypes'),
                ['SPACE']
            );
        });
    });
});
