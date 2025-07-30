const path = require('path');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const utils = require('../utils');

module.exports = {
    async GetCampaignStats() {
        // This test depends on a campaign existing from FindCampaigns test
        if (!global.testCampaignId) {
            console.log('GetCampaignStats: Skipping test - no test campaign ID available from FindCampaigns');
            return;
        }
        
        const context = utils.getContext({
            campaign_id: global.testCampaignId
        }, 'mailerlite', 'core/GetCampaignStats', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });

        try {
            const results = await utils.callComponent(context);
            
            // Basic type checks
            assert(typeof results === 'object', 'Results should be an object');
            
            console.log(`GetCampaignStats: Retrieved stats for campaign ID: ${global.testCampaignId}`);
            console.log('Campaign stats keys:', Object.keys(results));
            
        } catch (error) {
            // Some campaigns might not have stats available yet, which is normal
            if (error.message && error.message.includes('404')) {
                console.log('GetCampaignStats: Campaign stats not available (404) - this is normal for new/draft campaigns');
            } else {
                throw error;
            }
        }
    }
};
