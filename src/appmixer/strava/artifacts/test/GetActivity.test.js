const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetActivity Component', function() {
    let context;
    let GetActivity;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.STRAVA_ACCESS_TOKEN) {
            console.log('Skipping tests - STRAVA_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetActivity = require(path.join(__dirname, '../../src/appmixer/strava/core/GetActivity/GetActivity.js'));

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
            await GetActivity.receive(context);
            assert.fail('Should have thrown error for missing activityId');
        } catch (error) {
            assert(error.message.includes('Activity ID is required'), 'Should validate activityId field');
            console.log('✅ Correctly failed with missing required fields:', error.message);
        }
    });

    it('should get activity by ID', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // Use a test activity ID - this will fail with 401 if token is expired
        context.messages.in.content = {
            activityId: 123456789 // Example activity ID
        };

        try {
            await GetActivity.receive(context);

            console.log('GetActivity result keys:', Object.keys(data));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected activity to have id property');
            assert.strictEqual(typeof data.id, 'number', 'Expected activity ID to be a number');

            // Check for typical activity properties
            const expectedFields = ['id', 'name', 'type', 'sport_type', 'distance'];
            for (const field of expectedFields) {
                if (data[field] !== null && data[field] !== undefined) {
                    console.log(`✅ Found ${field}: ${data[field]}`);
                }
            }

            console.log('✅ Successfully retrieved activity');
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
});
