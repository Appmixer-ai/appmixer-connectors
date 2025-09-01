const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { createMockContext } = require('../utils.js');
const axios = require('axios');

describe('CreatePrediction Component', function() {
    let context;
    let CreatePrediction;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        CreatePrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/CreatePrediction/CreatePrediction.js'));

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

    it('should create a prediction with JSON input for image model', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf', // GFPGAN face restoration
            input: JSON.stringify({
                img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/256px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg'
            })
        };

        await CreatePrediction.receive(context);

        assert(outputData, 'Output should exist');
        assert(typeof outputData.id === 'string', 'Should have prediction ID');
        assert(typeof outputData.status === 'string', 'Should have status');
        assert(typeof outputData.version === 'string', 'Should have version');

        // Store the prediction ID for other tests
        global.testPredictionId = outputData.id;
    });

    it('should create a prediction with JSON input for text model', async function() {
        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            version: 'meta/llama-2-7b-chat:8e6975e5ed6174911a6ff3d60540dfd4844201974602551e10e9e87ab143d81e7',
            input: JSON.stringify({
                prompt: 'Write a short poem about the color orange',
                max_length: 100
            })
        };

        await CreatePrediction.receive(context);

        assert(outputData, 'Output should exist');
        assert(typeof outputData.id === 'string', 'Should have prediction ID');
        assert(typeof outputData.status === 'string', 'Should have status');
        assert(typeof outputData.version === 'string', 'Should have version');
    });
});
