const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('SendCampaign Component', function() {
    let context;
    let SendCampaign;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.MAILERLITE_ACCESS_TOKEN) {
            console.log('Skipping tests - MAILERLITE_ACCESS_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        SendCampaign = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/SendCampaign/SendCampaign.js'));

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

        assert(context.auth.apiKey, 'MAILERLITE_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should throw error when campaign ID is missing', async function() {
        context.messages.in.content = {};

        try {
            await SendCampaign.receive(context);
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

    it('should handle non-existent campaign ID (without sending)', async function() {
        context.messages.in.content = {
            campaignId: 'non-existent-campaign-12345'
        };

        try {
            await SendCampaign.receive(context);
            
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
            if (error.response && error.response.status === 422) {
                console.log('Campaign cannot be sent (422) - likely wrong status or validation issue');
                return; // This is expected for campaigns that can't be sent
            }
            throw error;
        }
    });

    it('should handle attempt to send draft campaign (will likely fail)', async function() {
        // This test is intentionally designed to fail safely
        // We're testing with a campaign ID that likely exists but can't be sent
        if (!global.testCampaignId) {
            console.log('Skipping test - no test campaign ID available');
            this.skip();
        }

        context.messages.in.content = {
            campaignId: global.testCampaignId
        };

        try {
            await SendCampaign.receive(context);
            
            console.log('⚠️ WARNING: Campaign send may have succeeded! Check your Mailerlite account');
            // If this succeeds, it means a campaign was actually sent
            // This should be rare in testing scenarios
            
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            if (error.response && error.response.status === 422) {
                console.log('Campaign cannot be sent (422) - this is expected for draft/invalid campaigns');
                console.log('Error details:', error.response.data);
                return; // This is the expected outcome
            }
            if (error.response && error.response.status === 404) {
                console.log('Campaign not found for sending');
                return; // This is also acceptable
            }
            if (error.response && error.response.status === 400) {
                console.log('Bad request for campaign send - likely validation issue');
                return; // This is also acceptable
            }
            throw error;
        }
    });

    // NOTE: We intentionally do NOT include a test that would actually send a real campaign
    // as that would send actual emails to real subscribers, which is not appropriate for automated tests.
    
    it('should validate input structure without sending', async function() {
        // Test that the component accepts the expected input format
        // without actually sending anything
        context.messages.in.content = {
            campaignId: 'test-validation-id-123'
        };

        try {
            await SendCampaign.receive(context);
        } catch (error) {
            // We expect this to fail with 404 or 422, not with input validation errors
            if (error.name === 'CancelError') {
                throw error; // This would indicate an input validation issue
            }
            if (error.response && (error.response.status === 404 || error.response.status === 422 || error.response.status === 400)) {
                console.log('Input validation passed, API returned expected error for non-existent campaign');
                return; // This is expected
            }
            if (error.response && error.response.status === 401) {
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            throw error;
        }
    });
});
