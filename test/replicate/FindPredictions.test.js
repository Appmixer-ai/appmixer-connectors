const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindPredictions Component', function() {
    let context;
    let FindPredictions;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.REPLICATE_ACCESS_TOKEN) {
            console.log('Skipping tests - REPLICATE_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component
        FindPredictions = require(path.join(__dirname, '../../src/appmixer/replicate/core/FindPredictions/FindPredictions.js'));

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
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        assert(context.auth.apiKey, 'REPLICATE_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should find predictions', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindPredictions.receive(context);

            console.log('FindPredictions result count:', data ? data.count : 'no data');

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const prediction = data.result[0];
                assert(prediction.id, 'Expected prediction to have id property');
                assert(prediction.status, 'Expected prediction to have status property');
                assert(prediction.created_at, 'Expected prediction to have created_at property');

                // Verify required fields are present
                const requiredFields = ['id', 'status', 'created_at'];
                for (const field of requiredFields) {
                    assert(field in prediction, `Expected prediction to have ${field} property`);
                }

                // Status should be one of the expected values
                const validStatuses = ['starting', 'processing', 'succeeded', 'failed', 'canceled'];
                assert(validStatuses.includes(prediction.status), `Expected status to be one of ${validStatuses.join(', ')}, got: ${prediction.status}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should handle object output type', async function() {
        context.messages.in.content = {
            outputType: 'object'
        };

        // Mock sendJson to capture all calls
        const sendJsonCalls = [];
        context.sendJson = function(data, port) {
            sendJsonCalls.push({ data, port });
            return { data, port };
        };

        try {
            await FindPredictions.receive(context);

            console.log('FindPredictions object output type calls count:', sendJsonCalls.length);

            if (sendJsonCalls.length > 0) {
                // For object output type, each prediction should be sent individually
                const callsToCheck = Math.min(sendJsonCalls.length, 3);
                for (let i = 0; i < callsToCheck; i++) {
                    const call = sendJsonCalls[i];
                    assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                    assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                    assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                    assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                }
            } else {
                console.log('No predictions found for object output type test');
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No predictions found for object output type test - this is acceptable');
                return;
            }
            throw error;
        }
    });

    it('should handle first output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'first'
        };

        try {
            await FindPredictions.receive(context);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.index === 'number', 'Expected data.index to be a number');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the REPLICATE_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No predictions found for first output type test - this is acceptable');
                return;
            }
            throw error;
        }
    });
});