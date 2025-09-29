const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/replicate/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Replicate lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['start', 'completed'];
            const result = normalizeMultiselectInput(input, mockContext, 'webhookEventsFilter');
            assert.deepStrictEqual(result, ['start', 'completed']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('start', mockContext, 'webhookEventsFilter'),
                ['start']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' output ', mockContext, 'webhookEventsFilter'),
                ['output']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('completed', mockContext, 'webhookEventsFilter'),
                ['completed']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('start,completed', mockContext, 'webhookEventsFilter'),
                ['start', 'completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('start, output, completed', mockContext, 'webhookEventsFilter'),
                ['start', 'output', 'completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' start , output , completed ', mockContext, 'webhookEventsFilter'),
                ['start', 'output', 'completed']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('start,,completed', mockContext, 'webhookEventsFilter'),
                ['start', 'completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('start, , completed', mockContext, 'webhookEventsFilter'),
                ['start', 'completed']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'webhookEventsFilter'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'webhookEventsFilter');
            }, /webhookEventsFilter must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'webhookEventsFilter');
            }, /webhookEventsFilter must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'webhookEventsFilter');
            }, /webhookEventsFilter must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'webhookEventsFilter'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('start,', mockContext, 'webhookEventsFilter'),
                ['start']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',completed', mockContext, 'webhookEventsFilter'),
                ['completed']
            );
        });
    });
});
