const path = require('path');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const utils = require('../utils');

module.exports = {
    async FindGroups() {
        const context = utils.getContext({
            outputType: 'array'
        }, 'mailerlite', 'core/FindGroups', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });

        const results = await utils.callComponent(context);
        
        // Basic type checks
        assert(typeof results === 'object', 'Results should be an object');
        assert(Array.isArray(results.result), 'Results should contain a result array');
        assert(typeof results.count === 'number', 'Results should contain a count number');
        
        console.log(`FindGroups: Found ${results.count} groups`);
        
        if (results.result.length > 0) {
            const firstGroup = results.result[0];
            assert(typeof firstGroup.id === 'string', 'Group should have an id string');
            assert(typeof firstGroup.name === 'string', 'Group should have a name string');
            console.log(`First group: ${firstGroup.name} (ID: ${firstGroup.id})`);
            
            // Store first group ID for other tests
            global.testGroupId = firstGroup.id;
        }
    },

    async 'FindGroups - generateOutputPortOptions'() {
        const context = utils.getContext({
            outputType: 'array'
        }, 'mailerlite', 'core/FindGroups', {
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
        
        console.log(`FindGroups output port options: ${results.length} options generated`);
    }
};
