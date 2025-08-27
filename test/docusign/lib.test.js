const assert = require('assert');
const { normalizeMultiselect } = require('../../src/appmixer/docusign/lib');

describe('Docusign lib', () => {

    describe('normalizeMultiselect', () => {

        it('should return undefined for empty/null/undefined values', () => {
            assert.strictEqual(normalizeMultiselect(undefined), undefined);
            assert.strictEqual(normalizeMultiselect(null), undefined);
            assert.strictEqual(normalizeMultiselect(''), undefined);
        });

        it('should return array as-is when input is already an array', () => {
            const input = ['value1', 'value2'];
            const result = normalizeMultiselect(input);
            assert.deepStrictEqual(result, ['value1', 'value2']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should split comma-separated string and trim whitespace', () => {
            assert.deepStrictEqual(normalizeMultiselect('value1,value2'), ['value1', 'value2']);
            assert.deepStrictEqual(normalizeMultiselect('value1, value2, value3'), ['value1', 'value2', 'value3']);
            assert.deepStrictEqual(normalizeMultiselect(' value1 , value2 , value3 '), ['value1', 'value2', 'value3']);
        });

        it('should handle single values', () => {
            assert.deepStrictEqual(normalizeMultiselect('single'), ['single']);
            assert.deepStrictEqual(normalizeMultiselect(' single '), ['single']);
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(normalizeMultiselect('value1,,value2'), ['value1', 'value2']);
            assert.deepStrictEqual(normalizeMultiselect('value1, , value2'), ['value1', 'value2']);
            assert.strictEqual(normalizeMultiselect(','), undefined);
        });

        it('should convert non-string values to string first', () => {
            assert.deepStrictEqual(normalizeMultiselect(123), ['123']);
            assert.deepStrictEqual(normalizeMultiselect(true), ['true']);
        });

        it('should handle edge cases', () => {
            assert.strictEqual(normalizeMultiselect('   '), undefined);
            assert.deepStrictEqual(normalizeMultiselect('value,'), ['value']);
            assert.deepStrictEqual(normalizeMultiselect(',value'), ['value']);
        });

        it('should handle DocuSign-specific multiselect values', () => {
            // Test with actual DocuSign event values
            assert.deepStrictEqual(
                normalizeMultiselect('envelope-sent,envelope-completed'),
                ['envelope-sent', 'envelope-completed']
            );

            // Test with include options
            assert.deepStrictEqual(
                normalizeMultiselect('custom_fields, documents, recipients'),
                ['custom_fields', 'documents', 'recipients']
            );
        });
    });
});
