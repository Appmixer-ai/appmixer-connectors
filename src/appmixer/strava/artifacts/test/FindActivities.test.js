const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindActivities Component', function() {
    let context;
    let FindActivities;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.STRAVA_ACCESS_TOKEN) {
            console.log('Skipping tests - STRAVA_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindActivities = require(path.join(__dirname, '../../src/appmixer/strava/core/FindActivities/FindActivities.js'));

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

    it('should find activities with array output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindActivities.receive(context);

            console.log('FindActivities result structure:', typeof data, Object.keys(data));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const activity = data.result[0];
                assert(activity.id, 'Expected activity to have id property');
                assert(activity.name, 'Expected activity to have name property');

                // Verify required fields are present
                const requiredFields = ['id', 'name'];
                for (const field of requiredFields) {
                    assert(field in activity, `Expected activity to have ${field} property`);
                }
            }

            console.log('✅ Successfully found activities');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                this.skip();
            } else {
                throw error;
            }
        }
    });

    it('should handle generateOutputPortOptions', async function() {
        let outputData;
        context.sendJson = function(data, port) {
            outputData = data;
            return data;
        };

        context.properties = { generateOutputPortOptions: true };
        context.messages.in.content = {
            outputType: 'array'
        };

        const result = await FindActivities.receive(context);

        assert(Array.isArray(result), 'Should return array for generateOutputPortOptions');
        assert(Array.isArray(outputData), 'sendJson should be called with array data');
        console.log('✅ Successfully generated output port options for FindActivities');
    });

    it('should find activities with date filters', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties = {};
        context.messages.in.content = {
            outputType: 'array',
            after: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // 30 days ago
            before: Math.floor(Date.now() / 1000) // Now
        };

        try {
            await FindActivities.receive(context);

            console.log('FindActivities with filters result structure:', typeof data, Object.keys(data));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            console.log('✅ Successfully found activities with date filters');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                this.skip();
            } else {
                throw error;
            }
        }
    });
});
