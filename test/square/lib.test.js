'use strict';

const assert = require('assert');
const lib = require('../../src/appmixer/square/lib.generated');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('Square lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return empty array for null/undefined input', () => {
            assert.deepEqual(lib.normalizeMultiselectInput(null, mockContext, 'Test Field'), []);
            assert.deepEqual(lib.normalizeMultiselectInput(undefined, mockContext, 'Test Field'), []);
        });

        it('should handle array input correctly', () => {
            const input = ['value1', 'value2', 'value3'];
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should handle array input with empty values', () => {
            const input = ['value1', '', 'value3', null, undefined, '  '];
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, ['value1', 'value3']);
        });

        it('should handle array input with whitespace trimming', () => {
            const input = [' value1 ', '  value2  ', ' value3'];
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should handle comma-separated string input', () => {
            const input = 'value1,value2,value3';
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should handle comma-separated string with spaces', () => {
            const input = 'value1, value2 , value3 ';
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should handle comma-separated string with empty values', () => {
            const input = 'value1,,value3, ,';
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, ['value1', 'value3']);
        });

        it('should handle single value string', () => {
            const input = 'single_value';
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, ['single_value']);
        });

        it('should handle empty string', () => {
            const input = '';
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, []);
        });

        it('should handle whitespace-only string', () => {
            const input = '   ';
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Test Field');
            assert.deepEqual(result, []);
        });

        it('should throw error for invalid input type', () => {
            assert.throws(() => {
                lib.normalizeMultiselectInput(123, mockContext, 'Test Field');
            }, mockContext.CancelError);

            assert.throws(() => {
                lib.normalizeMultiselectInput({ key: 'value' }, mockContext, 'Test Field');
            }, mockContext.CancelError);
        });

        it('should use field name in error message', () => {
            try {
                lib.normalizeMultiselectInput(123, mockContext, 'Custom Field Name');
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Custom Field Name'));
            }
        });

        // Test cases for Square-specific values
        it('should handle Square creation source values', () => {
            const input = ['APPOINTMENTS', 'DIRECTORY', 'THIRD_PARTY'];
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Creation Source');
            assert.deepEqual(result, ['APPOINTMENTS', 'DIRECTORY', 'THIRD_PARTY']);
        });

        it('should handle Square group IDs as strings', () => {
            const input = 'group1,group2,group3';
            const result = lib.normalizeMultiselectInput(input, mockContext, 'Group IDs');
            assert.deepEqual(result, ['group1', 'group2', 'group3']);
        });

    });

});
