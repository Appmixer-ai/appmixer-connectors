const assert = require('assert');

describe('lib.generated.js', () => {

    describe('sendArrayOutput', () => {

        const mockContext = {
            sendJson: function(data, port) {
                this.lastSent = { data, port };
                return Promise.resolve();
            },
            saveFileStream: function(fileName, buffer) {
                return Promise.resolve({ fileId: 'test-file-id' });
            },
            log: function(data) {
                return Promise.resolve();
            },
            config: {},
            flowDescriptor: {
                'test-component': { label: 'TestComponent' }
            },
            componentId: 'test-component',
            CancelError: class CancelError extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        const lib = require('../../lib.generated.js');

        it('should output array format correctly', async () => {
            const records = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];

            await lib.sendArrayOutput({
                context: mockContext,
                outputType: 'array',
                records: records
            });

            assert.strictEqual(mockContext.lastSent.port, 'out');
            assert.deepStrictEqual(mockContext.lastSent.data, {
                result: records,
                count: 2
            });
        });

        it('should output first item only', async () => {
            const records = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];

            await lib.sendArrayOutput({
                context: mockContext,
                outputType: 'first',
                records: records
            });

            assert.strictEqual(mockContext.lastSent.port, 'out');
            assert.deepStrictEqual(mockContext.lastSent.data, {
                id: 1,
                name: 'Item 1',
                index: 0,
                count: 2
            });
        });

        it('should throw error for first output type with empty records', async () => {
            try {
                await lib.sendArrayOutput({
                    context: mockContext,
                    outputType: 'first',
                    records: []
                });
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert(error.message.includes('No records available for first output type'));
            }
        });

        it('should output individual objects', async () => {
            const records = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];
            const sentItems = [];

            const contextWithMultipleSends = {
                ...mockContext,
                sendJson: function(data, port) {
                    sentItems.push({ data, port });
                    return Promise.resolve();
                }
            };

            await lib.sendArrayOutput({
                context: contextWithMultipleSends,
                outputType: 'object',
                records: records
            });

            assert.strictEqual(sentItems.length, 2);
            assert.deepStrictEqual(sentItems[0].data, {
                id: 1,
                name: 'Item 1',
                index: 0,
                count: 2
            });
            assert.deepStrictEqual(sentItems[1].data, {
                id: 2,
                name: 'Item 2',
                index: 1,
                count: 2
            });
        });

        it('should output file format correctly', async () => {
            const records = [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' }
            ];

            await lib.sendArrayOutput({
                context: mockContext,
                outputType: 'file',
                records: records
            });

            assert.strictEqual(mockContext.lastSent.port, 'out');
            assert.deepStrictEqual(mockContext.lastSent.data, {
                fileId: 'test-file-id'
            });
        });

        it('should throw error for unsupported output type', async () => {
            try {
                await lib.sendArrayOutput({
                    context: mockContext,
                    outputType: 'unsupported',
                    records: []
                });
                assert.fail('Should have thrown CancelError');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert(error.message.includes('Unsupported outputType'));
            }
        });
    });

    describe('getOutputPortOptions', () => {

        const mockContext = {
            sendJson: function(data, port) {
                this.lastSent = { data, port };
                return Promise.resolve();
            }
        };

        const lib = require('../../lib.generated.js');
        const testSchema = {
            id: { type: 'string', title: 'ID' },
            name: { type: 'string', title: 'Name' }
        };

        it('should return object options for object output type', () => {
            lib.getOutputPortOptions(mockContext, 'object', testSchema, { label: 'Items', value: 'items' });

            assert.strictEqual(mockContext.lastSent.port, 'out');
            assert(Array.isArray(mockContext.lastSent.data));
            assert(mockContext.lastSent.data.some(option => option.label === 'ID' && option.value === 'id'));
            assert(mockContext.lastSent.data.some(option => option.label === 'Name' && option.value === 'name'));
            assert(mockContext.lastSent.data.some(option => option.label === 'Current Item Index' && option.value === 'index'));
            assert(mockContext.lastSent.data.some(option => option.label === 'Items Count' && option.value === 'count'));
        });

        it('should return array options for array output type', () => {
            lib.getOutputPortOptions(mockContext, 'array', testSchema, { label: 'Items', value: 'items' });

            assert.strictEqual(mockContext.lastSent.port, 'out');
            assert(Array.isArray(mockContext.lastSent.data));
            assert.strictEqual(mockContext.lastSent.data.length, 2);
            assert.strictEqual(mockContext.lastSent.data[0].label, 'Items Count');
            assert.strictEqual(mockContext.lastSent.data[0].value, 'count');
            assert.strictEqual(mockContext.lastSent.data[1].label, 'Items');
            assert.strictEqual(mockContext.lastSent.data[1].value, 'result');
            assert.strictEqual(mockContext.lastSent.data[1].schema.type, 'array');
        });

        it('should return file options for file output type', () => {
            lib.getOutputPortOptions(mockContext, 'file', testSchema, { label: 'Items', value: 'items' });

            assert.strictEqual(mockContext.lastSent.port, 'out');
            assert(Array.isArray(mockContext.lastSent.data));
            assert.strictEqual(mockContext.lastSent.data.length, 1);
            assert.strictEqual(mockContext.lastSent.data[0].label, 'File ID');
            assert.strictEqual(mockContext.lastSent.data[0].value, 'fileId');
        });
    });
});
