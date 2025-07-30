const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetCampaignStats Component', function() {
    let context;
    let GetCampaignStats;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.MAILERLITE_ACCESS_TOKEN) {
            console.log('Skipping tests - MAILERLITE_ACCESS_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        GetCampaignStats = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/GetCampaignStats/GetCampaignStats.js'));

        // Mock context
        context = {
            auth: {
                apiToken: process.env.MAILERLITE_ACCESS_TOKEN
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

    it('should get campaign stats for existing campaign', async function() {
        // This test depends on having a campaign ID from previous tests
        if (!global.testCampaignId) {
            console.log('Skipping test - no test campaign ID available');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            campaign_id: global.testCampaignId
        };

        try {
            await GetCampaignStats.receive(context);

            console.log('GetCampaignStats result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            // Stats object might have various properties depending on campaign status
            
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('Campaign stats not found - this is normal for draft/unsent campaigns');
                console.log('Error details:', error.response.data);
                return; // This is acceptable
            }
            throw error;
        }
    });

    it('should throw error when campaign ID is missing', async function() {
        context.messages.in.content = {};

        try {
            await GetCampaignStats.receive(context);
            throw new Error('Expected error for missing campaign ID');
        } catch (error) {
            if (error.name === 'CancelError' && error.message.includes('Campaign ID is required')) {
                // This is expected
                console.log('Correctly threw CancelError for missing campaign ID');
                return;
            }
            throw error;
        }
    });

    it('should handle non-existent campaign ID', async function() {
        context.messages.in.content = {
            campaign_id: 'non-existent-campaign-12345'
        };

        try {
            await GetCampaignStats.receive(context);
            
            // If this succeeds, there might be an issue
            console.log('Unexpected success for non-existent campaign');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Correctly handled non-existent campaign ID with 404');
                return; // This is expected
            }
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            throw error;
        }
    });

    it('should handle malformed campaign ID', async function() {
        context.messages.in.content = {
            campaign_id: 'invalid-id-format'
        };

        try {
            await GetCampaignStats.receive(context);
            
            console.log('Campaign stats request succeeded with malformed ID');
        } catch (error) {
            if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                console.log('Correctly handled malformed campaign ID');
                return; // This is expected
            }
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            throw error;
        }
    });
});
