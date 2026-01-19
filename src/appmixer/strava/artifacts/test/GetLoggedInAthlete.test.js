const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetLoggedInAthlete Component', function() {
    let context;
    let GetLoggedInAthlete;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.STRAVA_ACCESS_TOKEN) {
            console.log('Skipping tests - STRAVA_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetLoggedInAthlete = require(path.join(__dirname, '../../src/appmixer/strava/core/GetLoggedInAthlete/GetLoggedInAthlete.js'));

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

    it('should get logged in athlete profile', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        try {
            await GetLoggedInAthlete.receive(context);

            console.log('GetLoggedInAthlete result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.id, 'Expected athlete to have id property');
            assert.strictEqual(typeof data.id, 'number', 'Expected athlete ID to be a number');

            // Check for typical athlete properties
            const expectedFields = ['id', 'username', 'firstname', 'lastname'];
            for (const field of expectedFields) {
                if (data[field] !== null && data[field] !== undefined) {
                    console.log(`✅ Found ${field}: ${data[field]}`);
                }
            }

            console.log('✅ Successfully retrieved athlete profile');
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
