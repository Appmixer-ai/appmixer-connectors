const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ListActivities Component', function() {
    let context;
    let ListActivities;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.STRAVA_ACCESS_TOKEN) {
            console.log('Skipping tests - STRAVA_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        ListActivities = require(path.join(__dirname, '../../src/appmixer/strava/core/ListActivities/ListActivities.js'));

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

    it('should list activities with array output type', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await ListActivities.receive(context);

            console.log('ListActivities result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array for array output');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            if (data.result.length > 0) {
                const activity = data.result[0];
                assert(activity.id, 'Expected activity to have id property');
                assert(activity.name, 'Expected activity to have name property');

                console.log(`✅ Found ${data.result.length} activities`);
                console.log('Sample activity:', {
                    id: activity.id,
                    name: activity.name,
                    type: activity.type,
                    sport_type: activity.sport_type
                });
            } else {
                console.log('✅ No activities found (empty array returned)');
            }

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
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties.generateOutputPortOptions = true;
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await ListActivities.receive(context);

            assert(Array.isArray(data), 'Expected data to be an array of options');

            const activitiesOption = data.find(option => option.value === 'Activities');
            if (activitiesOption) {
                console.log('✅ Found Activities option in output port configuration');
            }

            console.log('✅ Successfully generated output port options');
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
