const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('ListDatasets Component', function() {
    let context;
    let ListDatasets;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.AXIOM_API_TOKEN) {
            console.log('Skipping tests - AXIOM_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        ListDatasets = require(path.join(__dirname, '../datasets/ListDatasets/ListDatasets.js'));

        // Mock context
        context = {
            auth: {
                apiToken: process.env.AXIOM_API_TOKEN
            },
            messages: {
                in: {}
            },
            properties: {},
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        assert(context.auth.apiToken, 'AXIOM_API_TOKEN environment variable is required for tests');
    });

    it('should handle generateOutputPortOptions', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.properties = { generateOutputPortOptions: true };
        context.messages.in = {
            content: {
                outputType: 'array'
            }
        };

        await ListDatasets.receive(context);

        assert(Array.isArray(data), 'Expected array to be returned for output port options');
    });

    it('should list datasets successfully', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.properties = {};
        context.messages.in = {
            content: {
                outputType: 'array'
            }
        };

        await ListDatasets.receive(context);

        console.log('ListDatasets output:', JSON.stringify(data, null, 2));
        assert(data, 'Expected data to be returned');
        assert(typeof data.count !== 'undefined', 'Expected count field');
        assert(Array.isArray(data.result), 'Expected result to be an array');
    });

    it('should list datasets with first outputType', async function() {
        // Mock httpRequest to return sample data
        const mockHttpRequest = sinon.stub().resolves({
            data: [
                { id: 'dataset1', name: 'Test Dataset 1' },
                { id: 'dataset2', name: 'Test Dataset 2' }
            ]
        });

        context.httpRequest = mockHttpRequest;
        context.properties = {};

        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                outputType: 'first'
            }
        };

        await ListDatasets.receive(context);

        assert(data, 'Expected data to be returned');
        assert.strictEqual(data.id, 'dataset1', 'Expected first dataset ID');
        assert.strictEqual(data.index, 0, 'Expected index to be 0');
        assert.strictEqual(data.count, 2, 'Expected count to be 2');
    });
});
