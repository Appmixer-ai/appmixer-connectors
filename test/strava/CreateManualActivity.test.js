const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateManualActivity Component', function() {
    let context;
    let CreateManualActivity;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.STRAVA_ACCESS_TOKEN) {
            console.log('Skipping tests - STRAVA_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        CreateManualActivity = require(path.join(__dirname, '../../src/appmixer/strava/core/CreateManualActivity/CreateManualActivity.js'));

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

    it('should create a manual activity', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // Use dynamic timestamp to avoid conflicts
        const timestamp = new Date().toISOString();
        const uniqueName = `Test Run Activity ${Date.now()}`;

        context.messages.in.content = {
            name: uniqueName,
            sportType: 'Run',
            startDateLocal: timestamp,
            elapsedTime: 3600, // 1 hour in seconds
            description: 'Test activity created by Appmixer',
            distance: 5000 // 5km in meters
        };

        try {
            await CreateManualActivity.receive(context);

            console.log('CreateManualActivity result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected activity to have id property');
            assert.strictEqual(typeof data.id, 'number', 'Expected activity ID to be a number');
            assert.strictEqual(data.name, context.messages.in.content.name, 'Expected activity name to match');
            assert.strictEqual(data.sport_type, context.messages.in.content.sportType, 'Expected sport type to match');
            assert.strictEqual(data.elapsed_time, context.messages.in.content.elapsedTime, 'Expected elapsed time to match');
            assert.strictEqual(data.manual, true, 'Expected activity to be marked as manual');

            console.log('✅ Successfully created activity with ID:', data.id);
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

    it('should fail when required fields are missing', async function() {
        context.messages.in.content = {
            name: 'Test Activity'
            // Missing sportType, startDateLocal, elapsedTime
        };

        try {
            await CreateManualActivity.receive(context);
            assert.fail('Expected error for missing required fields');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Expected CancelError');
            assert(error.message.includes('Sport Type is required'), 'Expected error message about sportType');
            console.log('✅ Correctly failed with missing required fields:', error.message);
        }
    });

    it('should create activity with minimal required fields only', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // Use dynamic timestamp and unique name to avoid conflicts
        // Add some time offset to make it different from previous test
        const timestamp = new Date(Date.now() + 3600000).toISOString(); // 1 hour later
        const uniqueName = `Minimal Test Activity ${Date.now()}`;

        context.messages.in.content = {
            name: uniqueName,
            sportType: 'Walk',
            startDateLocal: timestamp,
            elapsedTime: 1800 // 30 minutes
        };

        try {
            await CreateManualActivity.receive(context);

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected activity to have id property');
            assert.strictEqual(data.name, context.messages.in.content.name, 'Expected activity name to match');
            assert.strictEqual(data.sport_type, context.messages.in.content.sportType, 'Expected sport type to match');
            assert.strictEqual(data.manual, true, 'Expected activity to be marked as manual');

            console.log('✅ Successfully created minimal activity with ID:', data.id);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                this.skip();
            } else {
                throw error;
            }
        }
    });
});
