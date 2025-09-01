const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { createMockContext } = require('../utils.js');
const axios = require('axios');

describe('ListPredictions Component', function() {
    let context;
    let ListPredictions;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        ListPredictions = require(path.join(__dirname, '../../src/appmixer/replicate/core/ListPredictions/ListPredictions.js'));

        assert(process.env.REPLICATE_ACCESS_TOKEN, 'REPLICATE_ACCESS_TOKEN environment variable is required for tests');
    });

    beforeEach(function() {
        // Create mock context with real HTTP request functionality
        context = createMockContext({
            auth: {
                apiKey: process.env.REPLICATE_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: async (options) => {
                const response = await axios(options);
                return response;
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        });
    });

    it('should list all predictions with array output type', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await ListPredictions.receive(context);

        assert(outputData, 'Output should exist');
        assert(typeof outputData === 'object', 'Result should be an object');
        assert(Array.isArray(outputData.result), 'Result should be an array');
        assert(typeof outputData.count === 'number', 'Count should be a number');

        if (outputData.result.length > 0) {
            const prediction = outputData.result[0];
            assert(typeof prediction.id === 'string', 'Prediction should have id');
            assert(typeof prediction.status === 'string', 'Prediction should have status');
            assert(typeof prediction.created_at === 'string', 'Prediction should have created_at');
        }
    });

    it('should return first prediction only', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            outputType: 'first'
        };

        await ListPredictions.receive(context);

        assert(outputData, 'Output should exist');
        assert(typeof outputData.id === 'string', 'Prediction should have id');
        assert(typeof outputData.status === 'string', 'Prediction should have status');
        assert(typeof outputData.index === 'number', 'Should have index');
        assert(typeof outputData.count === 'number', 'Should have count');
    });

    it('should handle object output type', async function() {
        let outputData = [];
        context.sendJson = function(output, port) {
            outputData.push(output);
        };

        context.messages.in.content = {
            outputType: 'object'
        };

        await ListPredictions.receive(context);

        assert(outputData.length > 0, 'Expected to receive some data objects');

        // For object output type, each item is sent individually with index and count
        if (outputData.length > 0) {
            const prediction = outputData[0];
            assert(typeof prediction === 'object', 'Expected data to be an object');
            assert(typeof prediction.index === 'number', 'Expected index to be a number');
            assert(typeof prediction.count === 'number', 'Expected count to be a number');
            assert(typeof prediction.id === 'string', 'Prediction should have id');
            assert(typeof prediction.status === 'string', 'Prediction should have status');
        }
    });
});
