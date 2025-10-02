const assert = require('assert');
const { normalizeMultiselectInput } = require('../../src/appmixer/googleSlides/lib');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    }
};

describe('GoogleSlides lib', () => {

    describe('normalizeMultiselectInput', () => {

        it('should return array as-is when input is already an array', () => {
            const input = ['presentationId', 'title', 'slides'];
            const result = normalizeMultiselectInput(input, mockContext, 'fields');
            assert.deepStrictEqual(result, ['presentationId', 'title', 'slides']);
            assert.strictEqual(result, input); // Should be the same reference
        });

        it('should handle single string value or comma-separated string', () => {
            // Single value without commas
            assert.deepStrictEqual(
                normalizeMultiselectInput('title', mockContext, 'fields'),
                ['title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' presentationId ', mockContext, 'fields'),
                ['presentationId']
            );

            // Comma-separated values
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId,title', mockContext, 'fields'),
                ['presentationId', 'title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId, title, slides', mockContext, 'fields'),
                ['presentationId', 'title', 'slides']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(' presentationId , title , slides ', mockContext, 'fields'),
                ['presentationId', 'title', 'slides']
            );
        });

        it('should filter out empty strings after splitting', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId,,title', mockContext, 'fields'),
                ['presentationId', 'title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('presentationId, , title', mockContext, 'fields'),
                ['presentationId', 'title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',', mockContext, 'fields'),
                []
            );
        });

        it('should throw error for invalid input types', () => {
            assert.throws(() => {
                normalizeMultiselectInput(123, mockContext, 'fields');
            }, /fields must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(true, mockContext, 'fields');
            }, /fields must be a string or an array/);

            assert.throws(() => {
                normalizeMultiselectInput(null, mockContext, 'fields');
            }, /fields must be a string or an array/);
        });

        it('should handle edge cases', () => {
            assert.deepStrictEqual(
                normalizeMultiselectInput('   ', mockContext, 'fields'),
                []
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput('title,', mockContext, 'fields'),
                ['title']
            );
            assert.deepStrictEqual(
                normalizeMultiselectInput(',title', mockContext, 'fields'),
                ['title']
            );
        });
    });

    describe('sendArrayOutput', () => {

        it('should export sendArrayOutput function', () => {
            const { sendArrayOutput } = require('../../src/appmixer/googleSlides/lib');
            assert.strictEqual(typeof sendArrayOutput, 'function', 'sendArrayOutput should be a function');
        });

        it('should deliver array output to the out port', async () => {
            const { sendArrayOutput } = require('../../src/appmixer/googleSlides/lib');
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
            const { sendArrayOutput } = require('../../src/appmixer/googleSlides/lib');
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
            const { sendArrayOutput } = require('../../src/appmixer/googleSlides/lib');
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
