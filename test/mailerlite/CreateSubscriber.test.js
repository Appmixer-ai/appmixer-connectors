const path = require('path');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const utils = require('../utils');

module.exports = {
    async CreateSubscriber() {
        // Generate a unique email for testing
        const testEmail = `test-${Date.now()}@example.com`;
        
        const context = utils.getContext({
            email: testEmail,
            name: 'Test User',
            groups: {
                AND: [] // Empty groups array for basic test
            }
        }, 'mailerlite', 'core/CreateSubscriber', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });

        const results = await utils.callComponent(context);
        
        // Basic type checks
        assert(typeof results === 'object', 'Results should be an object');
        assert(typeof results.id === 'string', 'Subscriber should have an id string');
        assert(typeof results.email === 'string', 'Subscriber should have an email string');
        assert(results.email === testEmail, 'Email should match the input');
        
        console.log(`CreateSubscriber: Created subscriber ${results.email} with ID: ${results.id}`);
        
        // Store the created subscriber ID for potential cleanup or further tests
        global.testSubscriberId = results.id;
        global.testSubscriberEmail = results.email;
    }
};
