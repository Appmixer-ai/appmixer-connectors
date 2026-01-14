const path = require('path');
const assert = require('assert');

describe('Axiom lib module', function() {

    let lib;

    before(function() {
        lib = require(path.join(__dirname, '../lib.js'));
    });

    describe('sendArrayOutput', function() {

        it('should send array output when outputType is array', async function() {
            const records = [
                { id: '1', name: 'Dataset 1' },
                { id: '2', name: 'Dataset 2' }
            ];

            let sentData;
            const mockContext = {
                sendJson: async function(data, port) {
                    sentData = data;
                    return { data, port };
                }
            };

            await lib.sendArrayOutput({
                context: mockContext,
                records,
                outputType: 'array'
            });

            assert(sentData, 'Expected data to be sent');
            assert.strictEqual(sentData.count, 2, 'Expected count to be 2');
            assert(Array.isArray(sentData.result), 'Expected result to be an array');
            assert.strictEqual(sentData.result.length, 2, 'Expected result length to be 2');
        });

        it('should send first item when outputType is first', async function() {
            const records = [
                { id: '1', name: 'Dataset 1' },
                { id: '2', name: 'Dataset 2' }
            ];

            let sentData;
            const mockContext = {
                sendJson: async function(data, port) {
                    sentData = data;
                    return { data, port };
                },
                CancelError: class extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            await lib.sendArrayOutput({
                context: mockContext,
                records,
                outputType: 'first'
            });

            assert(sentData, 'Expected data to be sent');
            assert.strictEqual(sentData.id, '1', 'Expected first item ID to be 1');
            assert.strictEqual(sentData.index, 0, 'Expected index to be 0');
            assert.strictEqual(sentData.count, 2, 'Expected count to be 2');
        });

        it('should throw error when outputType is first and no records', async function() {
            const records = [];

            const mockContext = {
                sendJson: async function(data, port) {
                    return { data, port };
                },
                CancelError: class extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await lib.sendArrayOutput({
                    context: mockContext,
                    records,
                    outputType: 'first'
                });
                assert.fail('Expected error for no records');
            } catch (error) {
                assert(error.message.includes('No records'), 'Expected error about no records');
            }
        });
    });

    describe('getOutputPortOptions', function() {

        it('should return options for array output type', function() {
            const schema = {
                'id': { 'type': 'string', 'title': 'ID' },
                'name': { 'type': 'string', 'title': 'Name' }
            };

            let sentData;
            const mockContext = {
                sendJson: function(data, port) {
                    sentData = data;
                    return { data, port };
                }
            };

            lib.getOutputPortOptions(mockContext, 'array', schema, { label: 'Items', value: 'items' });

            assert(Array.isArray(sentData), 'Expected array to be returned');
            assert.strictEqual(sentData.length, 1, 'Expected one option');
            assert.strictEqual(sentData[0].label, 'Items', 'Expected label to be Items');
            assert.strictEqual(sentData[0].value, 'items', 'Expected value to be items');
        });

        it('should return options for object output type', function() {
            const schema = {
                'id': { 'type': 'string', 'title': 'ID' },
                'name': { 'type': 'string', 'title': 'Name' }
            };

            let sentData;
            const mockContext = {
                sendJson: function(data, port) {
                    sentData = data;
                    return { data, port };
                }
            };

            lib.getOutputPortOptions(mockContext, 'object', schema, { label: 'Items', value: 'items' });

            assert(Array.isArray(sentData), 'Expected array to be returned');
            assert(sentData.length > 2, 'Expected multiple options including index and count');
            assert(sentData.some(opt => opt.value === 'index'), 'Expected index option');
            assert(sentData.some(opt => opt.value === 'count'), 'Expected count option');
        });
    });
});
