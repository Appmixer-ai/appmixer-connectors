const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindActivityStreams Component', function() {
    let context;
    let FindActivityStreams;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.STRAVA_ACCESS_TOKEN) {
            console.log('Skipping tests - STRAVA_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindActivityStreams = require(path.join(__dirname, '../../src/appmixer/strava/core/FindActivityStreams/FindActivityStreams.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.STRAVA_ACCESS_TOKEN
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

        assert(context.auth.accessToken, 'STRAVA_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should fail when activityId is missing', async function() {
        try {
            await FindActivityStreams.receive(context);
            assert.fail('Should have thrown error for missing activityId');
        } catch (error) {
            assert(error.message.includes('Activity ID is required'), 'Should validate activityId field');
            console.log('✅ Correctly failed with missing activityId:', error.message);
        }
    });

    it('should fail when keys are missing', async function() {
        context.messages.in.content = {
            activityId: 123456789
        };

        try {
            await FindActivityStreams.receive(context);
            assert.fail('Should have thrown error for missing keys');
        } catch (error) {
            assert(error.message.includes('At least one stream key must be selected'), 'Should validate keys field');
            console.log('✅ Correctly failed with missing keys:', error.message);
        }
    });

    it('should get activity streams', async function() {
        let sendJsonCalls = [];
        context.sendJson = function(output, port) {
            sendJsonCalls.push({ data: output, port });
            return output;
        };

        // Use a test activity ID - this will fail with 401 if token is expired
        context.messages.in.content = {
            activityId: 123456789, // Example activity ID
            keys: ['time', 'distance', 'latlng'],
            outputType: 'array'
        };

        try {
            await FindActivityStreams.receive(context);

            console.log('FindActivityStreams call count:', sendJsonCalls.length);
            if (sendJsonCalls.length > 0) {
                console.log('First call data keys:', Object.keys(sendJsonCalls[0].data));
            }

            console.log('✅ Successfully retrieved activity streams');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                this.skip();
            } else if (error.response && error.response.status === 404) {
                console.log('Activity not found - using test activity ID that may not exist');
                this.skip();
            } else {
                throw error;
            }
        }
    });

    it('should handle generateOutputPortOptions', async function() {
        context.sendJson = function(output, port) {
            return output;
        };

        context.properties = { generateOutputPortOptions: true };
        context.messages.in.content = {
            outputType: 'array'
        };

        const result = await FindActivityStreams.receive(context);

        assert(Array.isArray(result), 'Should return array for generateOutputPortOptions');
        console.log('✅ Successfully generated output port options');
    });
});
