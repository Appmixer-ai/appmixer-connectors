const path = require('path');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const utils = require('../utils');

module.exports = {
    async FindCampaigns() {
        const context = utils.getContext({
            outputType: 'array'
        }, 'mailerlite', 'core/FindCampaigns', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });

        const results = await utils.callComponent(context);
        
        // Basic type checks
        assert(typeof results === 'object', 'Results should be an object');
        assert(Array.isArray(results.result), 'Results should contain a result array');
        assert(typeof results.count === 'number', 'Results should contain a count number');
        
        console.log(`FindCampaigns: Found ${results.count} campaigns`);
        
        if (results.result.length > 0) {
            const firstCampaign = results.result[0];
            assert(typeof firstCampaign.id === 'string', 'Campaign should have an id string');
            assert(typeof firstCampaign.name === 'string' || firstCampaign.name === null, 'Campaign should have a name string or null');
            console.log(`First campaign: ${firstCampaign.name || 'Unnamed'} (ID: ${firstCampaign.id})`);
            
            // Store first campaign ID for other tests
            global.testCampaignId = firstCampaign.id;
        }
    },

    async 'FindCampaigns - with status filter'() {
        const context = utils.getContext({
            status: 'sent',
            outputType: 'array'
        }, 'mailerlite', 'core/FindCampaigns', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });

        const results = await utils.callComponent(context);
        
        // Basic type checks
        assert(typeof results === 'object', 'Results should be an object');
        assert(Array.isArray(results.result), 'Results should contain a result array');
        assert(typeof results.count === 'number', 'Results should contain a count number');
        
        console.log(`FindCampaigns with status filter: Found ${results.count} sent campaigns`);
    },

    async 'FindCampaigns - generateOutputPortOptions'() {
        const context = utils.getContext({
            outputType: 'array'
        }, 'mailerlite', 'core/FindCampaigns', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });
        
        context.properties.generateOutputPortOptions = true;
        
        const results = await utils.callComponent(context);
        
        // Verify output port options structure
        assert(Array.isArray(results), 'Output port options should be an array');
        assert(results.length > 0, 'Should have output port options');
        
        const firstOption = results[0];
        assert(typeof firstOption.label === 'string', 'Option should have a label');
        assert(typeof firstOption.value === 'string', 'Option should have a value');
        
        console.log(`FindCampaigns output port options: ${results.length} options generated`);
    }
};
