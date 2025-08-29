const assert = require('assert');

describe('lib.js', () => {

    describe('normalizeMultiselectInput', () => {

        const context = { CancelError: class CancelError extends Error {} };

        it('should return array of fieldIds as is', () => {
            const result = require('../../src/appmixer/airtable/lib').normalizeMultiselectInput(['field1', 'field2', 'field3'], 3, context, 'fieldsToMergeOn');
            assert.deepStrictEqual(result, ['field1', 'field2', 'field3']);
        });

        it('should convert comma-separated string to array', () => {
            const result = require('../../src/appmixer/airtable/lib').normalizeMultiselectInput('field1,field2,field3', 3, context, 'fieldsToMergeOn');
            assert.deepStrictEqual(result, ['field1', 'field2', 'field3']);
        });

        it('should handle comma-separated string with spaces', () => {
            const result = require('../../src/appmixer/airtable/lib').normalizeMultiselectInput('field1, field2 , field3', 3, context, 'fieldsToMergeOn');
            assert.deepStrictEqual(result, ['field1', 'field2', 'field3']);
        });

        it('should filter out empty strings from comma-separated input', () => {
            const result = require('../../src/appmixer/airtable/lib').normalizeMultiselectInput('field1,,field2,', 3, context, 'fieldsToMergeOn');
            assert.deepStrictEqual(result, ['field1', 'field2']);
        });

        it('should throw if array exceeds maxItems', () => {
            assert.throws(() => {
                require('../../src/appmixer/airtable/lib').normalizeMultiselectInput(['field1', 'field2', 'field3', 'field4'], 3, context, 'fieldsToMergeOn');
            }, context.CancelError);
        });

        it('should throw if comma-separated string exceeds maxItems', () => {
            assert.throws(() => {
                require('../../src/appmixer/airtable/lib').normalizeMultiselectInput('field1,field2,field3,field4', 3, context, 'fieldsToMergeOn');
            }, context.CancelError);
        });

        it('should throw if input is not array or string', () => {
            assert.throws(() => {
                require('../../src/appmixer/airtable/lib').normalizeMultiselectInput(123, 3, context, 'fieldsToMergeOn');
            }, context.CancelError);
        });

        it('should not throw when maxItems is Infinity', () => {
            const result = require('../../src/appmixer/airtable/lib').normalizeMultiselectInput(['field1', 'field2', 'field3', 'field4', 'field5'], Infinity, context, 'fields');
            assert.deepStrictEqual(result, ['field1', 'field2', 'field3', 'field4', 'field5']);
        });

        it('should handle large arrays when maxItems is Infinity', () => {
            const largeArray = Array.from({ length: 100 }, (_, i) => `field${i + 1}`);
            const result = require('../../src/appmixer/airtable/lib').normalizeMultiselectInput(largeArray, Infinity, context, 'fields');
            assert.deepStrictEqual(result, largeArray);
        });

        it('should handle large comma-separated string when maxItems is Infinity', () => {
            const largeString = Array.from({ length: 100 }, (_, i) => `field${i + 1}`).join(',');
            const expectedArray = Array.from({ length: 100 }, (_, i) => `field${i + 1}`);
            const result = require('../../src/appmixer/airtable/lib').normalizeMultiselectInput(largeString, Infinity, context, 'fields');
            assert.deepStrictEqual(result, expectedArray);
        });
    });
});
