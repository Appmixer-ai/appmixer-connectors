const assert = require('assert');
const { normalizeMultiselect } = require('../../src/appmixer/clickup/lib');

describe('ClickUp lib', () => {

    describe('normalizeMultiselect', () => {

        it('should return undefined for empty/null/undefined values', () => {

            assert.strictEqual(normalizeMultiselect(undefined), undefined);
            assert.strictEqual(normalizeMultiselect(null), undefined);
            assert.strictEqual(normalizeMultiselect(''), undefined);
        });

        it('should return array as-is when input is already an array', () => {

            const input = ['completed', 'in progress'];
            const result = normalizeMultiselect(input);
            assert.deepStrictEqual(result, ['completed', 'in progress']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should split comma-separated string and trim whitespace', () => {

            assert.deepStrictEqual(normalizeMultiselect('completed,in progress'), ['completed', 'in progress']);
            assert.deepStrictEqual(normalizeMultiselect('completed, in progress, to do'), ['completed', 'in progress', 'to do']);
            assert.deepStrictEqual(normalizeMultiselect(' completed , in progress , to do '), ['completed', 'in progress', 'to do']);
        });

        it('should handle single values', () => {

            assert.deepStrictEqual(normalizeMultiselect('completed'), ['completed']);
            assert.deepStrictEqual(normalizeMultiselect(' completed '), ['completed']);
        });

        it('should filter out empty strings after splitting', () => {

            assert.deepStrictEqual(normalizeMultiselect('completed,,in progress'), ['completed', 'in progress']);
            assert.deepStrictEqual(normalizeMultiselect('completed, , in progress'), ['completed', 'in progress']);
            assert.strictEqual(normalizeMultiselect(','), undefined);
        });

        it('should convert non-string values to string first', () => {

            assert.deepStrictEqual(normalizeMultiselect(123), ['123']);
            assert.deepStrictEqual(normalizeMultiselect(true), ['true']);
        });

        it('should handle edge cases', () => {

            assert.strictEqual(normalizeMultiselect('   '), undefined);
            assert.deepStrictEqual(normalizeMultiselect('completed,'), ['completed']);
            assert.deepStrictEqual(normalizeMultiselect(',completed'), ['completed']);
        });
    });
});
