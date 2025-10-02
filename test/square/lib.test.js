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


    describe('sendArrayOutput', () => {

        it('should export sendArrayOutput function', () => {
            const { sendArrayOutput } = require('../../src/appmixer/square/lib.generated');
            assert.strictEqual(typeof sendArrayOutput, 'function', 'sendArrayOutput should be a function');
        });

        it('should deliver array output to the out port', async () => {
            const { sendArrayOutput } = require('../../src/appmixer/square/lib.generated');
            const sampleRecords = [
                { id: 1, name: 'Alpha' },
                { id: 2, name: 'Beta' }
            ];

            const calls = [];
            const context = {
                sendJson: async (payload, port) => {
                    calls.push({ method: 'sendJson', payload, port });
                },
                sendArray: async (payload, port) => {
                    calls.push({ method: 'sendArray', payload, port });
                },
                flowDescriptor: {
                    componentId: { label: 'Component Label' }
                },
                componentId: 'componentId',
                config: { outputFilePrefix: 'test-prefix' },
                CancelError: class extends Error {}
            };

            await sendArrayOutput({
                context,
                outputPortName: 'out',
                outputType: 'array',
                records: sampleRecords
            });

            const jsonCalls = calls.filter(call => call.method === 'sendJson');
            assert.ok(jsonCalls.length >= 1, 'should call context.sendJson for array output');
            assert.strictEqual(jsonCalls[0].port, 'out', 'should target the out port');
            assert.deepStrictEqual(jsonCalls[0].payload, { result: sampleRecords, count: sampleRecords.length }, 'should format array payload correctly');
        });

        it('should write files when outputType is file', async () => {
            const { sendArrayOutput } = require('../../src/appmixer/square/lib.generated');
            const sampleRecords = [
                { id: 1, name: 'Alpha' },
                { id: 2, name: 'Beta' }
            ];

            const calls = [];
            const savedFiles = [];
            const context = {
                sendJson: async (payload, port) => {
                    calls.push({ method: 'sendJson', payload, port });
                },
                sendArray: async (payload, port) => {
                    calls.push({ method: 'sendArray', payload, port });
                },
                saveFileStream: async (fileName, buffer) => {
                    savedFiles.push({ fileName, buffer });
                    return { fileId: 'file-123' };
                },
                log: async (...args) => {},
                flowDescriptor: {
                    componentId: { label: 'Component Label' }
                },
                componentId: 'componentId',
                config: { outputFilePrefix: 'test-prefix' },
                CancelError: class extends Error {}
            };

            await sendArrayOutput({
                context,
                outputPortName: 'out',
                outputType: 'file',
                records: sampleRecords
            });

            assert.strictEqual(savedFiles.length, 1, 'should save exactly one file');
            assert.ok(savedFiles[0].fileName.includes('test-prefix-Component Label.csv'), 'should include the configured prefix in file name');

            const jsonCalls = calls.filter(call => call.method === 'sendJson');
            assert.ok(jsonCalls.length >= 1, 'should send JSON confirmation for file output');
            assert.deepStrictEqual(jsonCalls[jsonCalls.length - 1].payload, { fileId: 'file-123' }, 'should report saved file');
        });

        it('should throw CancelError for unsupported output types', async () => {
            const { sendArrayOutput } = require('../../src/appmixer/square/lib.generated');
            const sampleRecords = [
                { id: 1, name: 'Alpha' },
                { id: 2, name: 'Beta' }
            ];

            class TestCancelError extends Error {}
            const context = {
                sendJson: async () => {},
                sendArray: async () => {},
                flowDescriptor: {
                    componentId: { label: 'Component Label' }
                },
                componentId: 'componentId',
                config: {},
                CancelError: TestCancelError
            };

            await assert.rejects(async () => {
                await sendArrayOutput({
                    context,
                    outputPortName: 'out',
                    outputType: 'unsupported',
                    records: sampleRecords
                });
            }, (error) => {
                assert(error instanceof context.CancelError, 'should throw context.CancelError');
                return true;
            });
        });
    });

});
