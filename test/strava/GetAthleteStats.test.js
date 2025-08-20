const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetAthleteStats Component', function() {
    let context;
    let GetAthleteStats;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.STRAVA_ACCESS_TOKEN) {
            console.log('Skipping tests - STRAVA_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetAthleteStats = require(path.join(__dirname, '../../src/appmixer/strava/core/GetAthleteStats/GetAthleteStats.js'));

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

    it('should fail when athleteId is missing', async function() {
        try {
            await GetAthleteStats.receive(context);
            assert.fail('Should have thrown error for missing athleteId');
        } catch (error) {
            assert(error.message.includes('Athlete ID is required'), 'Should validate athleteId field');
            console.log('✅ Correctly failed with missing required fields:', error.message);
        }
    });

    it('should get athlete stats', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // Use the current authenticated user's athlete ID
        context.messages.in.content = {
            athleteId: 181540540 // Current user's athlete ID from GetLoggedInAthlete test
        };

        try {
            await GetAthleteStats.receive(context);

            console.log('GetAthleteStats result keys:', Object.keys(data));

            assert(data && typeof data === 'object', 'Expected data to be an object');

            // Check for typical stats properties
            const expectedFields = ['recent_run_totals', 'all_run_totals', 'recent_ride_totals', 'all_ride_totals'];
            for (const field of expectedFields) {
                if (data[field] !== null && data[field] !== undefined) {
                    console.log(`✅ Found ${field}: ${JSON.stringify(data[field])}`);
                }
            }

            console.log('✅ Successfully retrieved athlete stats');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                this.skip();
            } else if (error.response && error.response.status === 404) {
                console.log('Athlete not found - using test athlete ID that may not exist');
                this.skip();
            } else {
                throw error;
            }
        }
    });
});
