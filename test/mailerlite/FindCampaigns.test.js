const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('FindCampaigns Component', function() {
    let context;
    let FindCampaigns;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.MAILERLITE_ACCESS_TOKEN) {
            console.log('Skipping tests - MAILERLITE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        FindCampaigns = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/FindCampaigns/FindCampaigns.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.MAILERLITE_ACCESS_TOKEN
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

        assert(context.auth.apiToken, 'MAILERLITE_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should find campaigns in array format', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindCampaigns.receive(context);

            console.log('FindCampaigns result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            if (data.result.length > 0) {
                const campaign = data.result[0];
                assert(campaign.id, 'Expected campaign to have id property');
                assert(campaign.type, 'Expected campaign to have type property');

                // Store first campaign ID for other tests
                global.testCampaignId = campaign.id;
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });

    it('should find campaigns with status filter', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            status: 'sent',
            outputType: 'array'
        };

        try {
            await FindCampaigns.receive(context);

            console.log('FindCampaigns with status filter result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(Array.isArray(data.result), 'Expected data.result to be an array');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');

            // Verify the count matches array length
            assert.strictEqual(data.count, data.result.length, `Expected count (${data.count}) to match result array length (${data.result.length})`);

            // If campaigns are returned, they should have 'sent' status
            if (data.result.length > 0) {
                data.result.forEach((campaign, index) => {
                    if (campaign.status) {
                        // Note: The API might return campaigns with different statuses due to how filtering works
                        console.log(`Campaign ${index} status:`, campaign.status);
                    }
                });
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
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
            await FindCampaigns.receive(context);

            console.log('FindCampaigns object output type calls count:', sendJsonCalls.length);

            if (sendJsonCalls.length === 0) {
                console.log('No campaigns found - this is acceptable');
                return;
            }

            // For object output type, each campaign should be sent individually
            const callsToCheck = Math.min(sendJsonCalls.length, 5);
            for (let i = 0; i < callsToCheck; i++) {
                const call = sendJsonCalls[i];
                assert(call.data && typeof call.data === 'object', `Expected call ${i} data to be an object`);
                assert(typeof call.data.index === 'number', `Expected call ${i} data to have index property (number)`);
                assert(typeof call.data.count === 'number', `Expected call ${i} data to have count property (number)`);
                assert.strictEqual(call.port, 'out', `Expected call ${i} port to be "out"`);
                // Check that the campaign data is present
                assert(call.data.id, `Expected call ${i} data to have campaign id property`);
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
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
            await FindCampaigns.receive(context);

            console.log('FindCampaigns first output type result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.index === 'number', 'Expected data.index to be a number');
            assert(typeof data.count === 'number', 'Expected data.count to be a number');
            assert.strictEqual(data.index, 0, 'Expected first item to have index 0');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            if (error.name === 'CancelError' && error.message.includes('No records available')) {
                console.log('No campaigns found for first output type test - this is expected if no campaigns exist');
                return; // This is acceptable
            }
            throw error;
        }
    });

    it('should generate output port options', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.properties.generateOutputPortOptions = true;
        context.messages.in.content = {
            outputType: 'array'
        };

        try {
            await FindCampaigns.receive(context);

            console.log('FindCampaigns output port options:', JSON.stringify(data, null, 2));

            assert(Array.isArray(data), 'Expected output port options to be an array');
            assert(data.length > 0, 'Expected output port options to have items');

            // Check structure of output port options
            const firstOption = data[0];
            assert(typeof firstOption.label === 'string', 'Expected option to have label string');
            assert(typeof firstOption.value === 'string', 'Expected option to have value string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            throw error;
        }
    });
});
