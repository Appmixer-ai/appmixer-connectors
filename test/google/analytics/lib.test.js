const assert = require('assert');
const { normalizeMultiselectInput } = require('../../../src/appmixer/google/analytics/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Google Analytics lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['value1', 'value2'];
            const result = normalizeMultiselectInput(input, mockContext, 'dimensions');
            assert.deepStrictEqual(result, ['value1', 'value2']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('single', mockContext, 'dimensions'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' single ', mockContext, 'dimensions'),
                ['single']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('ga:dimension1', mockContext, 'dimensions'),
                ['ga:dimension1']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('ga:dimension1,ga:dimension2', mockContext, 'dimensions'),
                ['ga:dimension1', 'ga:dimension2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('ga:metric1, ga:metric2, ga:metric3', mockContext, 'metrics'),
                ['ga:metric1', 'ga:metric2', 'ga:metric3']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' ga:dimension1 , ga:dimension2 , ga:dimension3 ', mockContext, 'dimensions'),
                ['ga:dimension1', 'ga:dimension2', 'ga:dimension3']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('ga:dimension1,,ga:dimension2', mockContext, 'dimensions'),
                ['ga:dimension1', 'ga:dimension2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('ga:metric1, , ga:metric2', mockContext, 'metrics'),
                ['ga:metric1', 'ga:metric2']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'dimensions'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'dimensions');
            }, /dimensions must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'metrics');
            }, /metrics must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'dimensions');
            }, /dimensions must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'dimensions'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('ga:dimension1,', mockContext, 'dimensions'),
                ['ga:dimension1']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',ga:dimension1', mockContext, 'dimensions'),
                ['ga:dimension1']
            );
        });

        it('should handle Google Analytics specific dimension and metric formats', () => {
            // GA4 style dimensions
            assert.deepStrictEqual(
                normalizeMultiselectInput('country,city,browser', mockContext, 'dimensions'),
                ['country', 'city', 'browser']
            );

            // GA4 style metrics
            assert.deepStrictEqual(
                normalizeMultiselectInput('sessions,users,pageviews', mockContext, 'metrics'),
                ['sessions', 'users', 'pageviews']
            );

            // Mixed formats
            assert.deepStrictEqual(
                normalizeMultiselectInput('ga:country, city, pageTitle', mockContext, 'dimensions'),
                ['ga:country', 'city', 'pageTitle']
            );
        });
    });
});
