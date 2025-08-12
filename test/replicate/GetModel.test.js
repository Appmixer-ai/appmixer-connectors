const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { createMockContext } = require('../utils.js');
const axios = require('axios');

describe('GetModel Component', function() {
    let context;
    let GetModel;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetModel = require(path.join(__dirname, '../../src/appmixer/replicate/core/GetModel/GetModel.js'));

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

    it('should get model details', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            modelOwner: 'replicate',
            modelName: 'hello-world'
        };

        await GetModel.receive(context);

        assert(outputData, 'Expected output data');
        assert(typeof outputData === 'object', 'Expected data to be an object');
        assert(typeof outputData.name === 'string', 'Expected model to have name');
        assert(typeof outputData.owner === 'string', 'Expected model to have owner');
        assert(typeof outputData.url === 'string', 'Expected model to have url');
        assert(outputData.owner === 'replicate', 'Expected owner to match requested owner');
        assert(outputData.name === 'hello-world', 'Expected name to match requested name');
    });

    it('should get another model with detailed info', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            modelOwner: 'tencentarc',
            modelName: 'gfpgan'
        };

        await GetModel.receive(context);

        assert(outputData, 'Output should exist');
        assert(typeof outputData.url === 'string', 'Should have url');
        assert(typeof outputData.owner === 'string', 'Should have owner');
        assert(typeof outputData.name === 'string', 'Should have name');
        assert(typeof outputData.description === 'string', 'Should have description');
        assert(outputData.owner === 'tencentarc', 'Should return correct owner');
        assert(outputData.name === 'gfpgan', 'Should return correct name');

        if (outputData.latest_version) {
            assert(typeof outputData.latest_version === 'object', 'Latest version should be object');
        }
    });

    it('should get stable diffusion model', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            modelOwner: 'stability-ai',
            modelName: 'stable-diffusion'
        };

        await GetModel.receive(context);

        assert(outputData, 'Output should exist');
        assert(typeof outputData.url === 'string', 'Should have url');
        assert(typeof outputData.owner === 'string', 'Should have owner');
        assert(typeof outputData.name === 'string', 'Should have name');
        assert(outputData.owner === 'stability-ai', 'Should return correct owner');
        assert(outputData.name === 'stable-diffusion', 'Should return correct name');
    });
});
