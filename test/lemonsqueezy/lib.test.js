'use strict';

const assert = require('assert');
const { sendArrayOutput } = require('../../src/appmixer/lemonsqueezy/lib.generated');

const sampleRecords = [
    { id: 1, name: 'Alpha' },
    { id: 2, name: 'Beta' }
];

class TestCancelError extends Error {}

function createContext() {
    const calls = [];
    const savedFiles = [];
    const logs = [];

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
        log: async (...args) => {
            logs.push(args);
        },
        flowDescriptor: {
            componentId: {
                label: 'Component Label'
            }
        },
        componentId: 'componentId',
        config: {
            outputFilePrefix: 'test-prefix'
        },
        CancelError: TestCancelError
    };

    return { context, calls, savedFiles, logs };
}

describe('lemonsqueezy lib', () => {

    describe('sendArrayOutput', () => {

        it('should export sendArrayOutput function', () => {
            assert.strictEqual(typeof sendArrayOutput, 'function', 'sendArrayOutput should be a function');
        });

        it('should deliver array output to the out port', async () => {
            const { context, calls } = createContext();
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
            const { context, calls, savedFiles } = createContext();
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
            const { context } = createContext();
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
