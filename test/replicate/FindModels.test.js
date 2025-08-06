const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindModels Component', function() {
    let context;
    let FindModels;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindModels = require(path.join(__dirname, '../../src/appmixer/replicate/core/FindModels/FindModels.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.REPLICATE_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: require('./httpRequest.js')
        };

        assert(context.auth.apiKey, 'REPLICATE_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should find models without search query', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        await FindModels.receive(context);
        
        console.log('FindModels without search result count:', outputData.count);

        assert(outputData, 'Expected output data');
        assert(typeof outputData === 'object', 'Expected data to be an object');
        assert(Array.isArray(outputData.result), 'Expected result to be an array');
        assert(typeof outputData.count === 'number', 'Expected count to be a number');
        assert(outputData.count > 0, 'Expected to find some models');
        
        if (outputData.result.length > 0) {
            const model = outputData.result[0];
            assert(typeof model.url === 'string', 'Expected model to have url');
            assert(typeof model.owner === 'string', 'Expected model to have owner');
            assert(typeof model.name === 'string', 'Expected model to have name');
            // Description is optional
            if (model.description) {
                assert(typeof model.description === 'string', 'Expected model description to be a string');
            }
        }
    });

    it('should find models with search query', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            search: 'diffusion',
            outputType: 'array'
        };

        await FindModels.receive(context);
        
        console.log('FindModels with search query result count:', outputData.count);

        assert(outputData, 'Expected output data');
        assert(typeof outputData === 'object', 'Expected data to be an object');
        assert(Array.isArray(outputData.result), 'Expected result to be an array');
        assert(typeof outputData.count === 'number', 'Expected count to be a number');
        assert(outputData.count > 0, 'Expected to find some models matching search');
    });

    it('should handle object output type', async function() {
        let outputData = [];
        context.sendJson = function(output, port) {
            outputData.push(output);
        };

        context.messages.in.content = {
            outputType: 'object'
        };

        await FindModels.receive(context);
        
        console.log('FindModels object output type calls count:', outputData.length);

        assert(outputData.length > 0, 'Expected to receive some data objects');
        
        // For object output type, each item is sent individually with index and count
        if (outputData.length > 0) {
            const model = outputData[0];
            assert(typeof model === 'object', 'Expected data to be an object');
            assert(typeof model.index === 'number', 'Expected index to be a number');
            assert(typeof model.count === 'number', 'Expected count to be a number');
            assert(typeof model.url === 'string', 'Expected model to have url');
            assert(typeof model.owner === 'string', 'Expected model to have owner');
            assert(typeof model.name === 'string', 'Expected model to have name');
        }
    });

    it('should handle first output type', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            outputType: 'first'
        };

        await FindModels.receive(context);

        assert(outputData, 'Expected output data');
        assert(typeof outputData === 'object', 'Expected data to be an object');
        assert(typeof outputData.index === 'number', 'Expected index to be a number');
        assert(typeof outputData.count === 'number', 'Expected count to be a number');
        assert(outputData.index === 0, 'Expected first item to have index 0');
        
        // Should have model properties plus index and count
        assert(typeof outputData.url === 'string', 'Expected model to have url');
        assert(typeof outputData.owner === 'string', 'Expected model to have owner');
        assert(typeof outputData.name === 'string', 'Expected model to have name');
    });
});
