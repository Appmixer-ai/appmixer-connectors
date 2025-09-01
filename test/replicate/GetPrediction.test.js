const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { createMockContext } = require('../utils.js');
const axios = require('axios');

describe('GetPrediction Component', function() {
    let context;
    let GetPrediction;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetPrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/GetPrediction/GetPrediction.js'));

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

    it('should get prediction details if prediction exists', async function() {
        // Skip this test if no test prediction ID is available
        if (!global.testPredictionId) {
            console.log('Skipping test - no test prediction ID available. Run CreatePrediction test first.');
            this.skip();
        }

        let outputData;
        context.sendJson = function(output, port) {
            outputData = output;
        };

        context.messages.in.content = {
            predictionId: global.testPredictionId
        };

        await GetPrediction.receive(context);

        assert(outputData, 'Output should exist');
        assert(typeof outputData.id === 'string', 'Should have prediction ID');
        assert(typeof outputData.status === 'string', 'Should have status');
        assert(typeof outputData.created_at === 'string', 'Should have created_at');
        assert(outputData.id === global.testPredictionId, 'Should return the correct prediction');
    });
});
