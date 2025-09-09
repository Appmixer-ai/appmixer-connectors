const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/zendesk/tickets/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Zendesk lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['value1', 'value2'];
            const result = normalizeMultiselectInput(input, mockContext, 'eventTypes');
            assert.deepStrictEqual(result, ['value1', 'value2']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('single', mockContext, 'eventTypes'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' single ', mockContext, 'eventTypes'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('zen:event-type:user.created', mockContext, 'eventTypes'),
                ['zen:event-type:user.created']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1,value2', mockContext, 'eventTypes'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1, value2, value3', mockContext, 'eventTypes'),
                ['value1', 'value2', 'value3']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' value1 , value2 , value3 ', mockContext, 'eventTypes'),
                ['value1', 'value2', 'value3']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1,,value2', mockContext, 'eventTypes'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value1, , value2', mockContext, 'eventTypes'),
                ['value1', 'value2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'eventTypes'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'eventTypes');
            }, /eventTypes must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'eventTypes');
            }, /eventTypes must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'eventTypes');
            }, /eventTypes must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'eventTypes'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('value,', mockContext, 'eventTypes'),
                ['value']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',value', mockContext, 'eventTypes'),
                ['value']
            );
        });

        it('should handle real Zendesk event type values', () => {
            // Test with actual Zendesk event types
            const eventTypes = [
                'zen:event-type:user.created',
                'zen:event-type:user.deleted',
                'zen:event-type:organization.created'
            ];

            // Array input
            assert.deepStrictEqual(
                normalizeMultiselectInput(eventTypes, mockContext, 'eventTypes'),
                eventTypes
            );

            // Comma-separated string input
            const commaSeparated = eventTypes.join(',');
            assert.deepStrictEqual(
                normalizeMultiselectInput(commaSeparated, mockContext, 'eventTypes'),
                eventTypes
            );

            // Comma-separated with spaces
            const commaSeparatedWithSpaces = eventTypes.join(', ');
            assert.deepStrictEqual(
                normalizeMultiselectInput(commaSeparatedWithSpaces, mockContext, 'eventTypes'),
                eventTypes
            );
        });
    });
});
