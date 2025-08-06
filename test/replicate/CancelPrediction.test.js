const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { createMockContext } = require('../utils.js');
const axios = require('axios');

describe('CancelPrediction Component', function() {
    let context;
    let CancelPrediction;

    this.timeout(60000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        CancelPrediction = require(path.join(__dirname, '../../src/appmixer/replicate/core/CancelPrediction/CancelPrediction.js'));

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

    it('should handle non-existent prediction ID for cancellation', async function() {
        context.sendJson = function(output, port) {
            // Just capture the output without storing it
        };

        context.messages.in.content = {
            predictionId: 'nonexistent-prediction-id'
        };

        try {
            await CancelPrediction.receive(context);
            assert.fail('Expected error for non-existent prediction ID');
        } catch (error) {
            // Should get a 404 or similar error
            assert(error.response, 'Expected HTTP error response');
            assert([404, 422].includes(error.response.status), `Expected 404 or 422 status code, got: ${error.response.status}`);
        }
    });
});
