const path = require('path');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const utils = require('../utils');

module.exports = {
    async GetSubscriber() {
        // This test depends on a subscriber existing from CreateSubscriber test
        if (!global.testSubscriberId) {
            console.log('GetSubscriber: Skipping test - no test subscriber ID available from CreateSubscriber');
            return;
        }
        
        const context = utils.getContext({
            subscriber_id: global.testSubscriberId
        }, 'mailerlite', 'core/GetSubscriber', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });

        const results = await utils.callComponent(context);
        
        // Basic type checks
        assert(typeof results === 'object', 'Results should be an object');
        assert(typeof results.id === 'string', 'Subscriber should have an id string');
        assert(typeof results.email === 'string', 'Subscriber should have an email string');
        assert(results.id === global.testSubscriberId, 'ID should match the requested subscriber ID');
        
        console.log(`GetSubscriber: Retrieved subscriber ${results.email} with ID: ${results.id}`);
    },

    async 'GetSubscriber - by email'() {
        // This test depends on a subscriber existing from CreateSubscriber test
        if (!global.testSubscriberEmail) {
            console.log('GetSubscriber by email: Skipping test - no test subscriber email available from CreateSubscriber');
            return;
        }
        
        const context = utils.getContext({
            email: global.testSubscriberEmail
        }, 'mailerlite', 'core/GetSubscriber', {
            MAILERLITE_ACCESS_TOKEN: process.env.MAILERLITE_ACCESS_TOKEN
        });

        const results = await utils.callComponent(context);
        
        // Basic type checks
        assert(typeof results === 'object', 'Results should be an object');
        assert(typeof results.id === 'string', 'Subscriber should have an id string');
        assert(typeof results.email === 'string', 'Subscriber should have an email string');
        assert(results.email === global.testSubscriberEmail, 'Email should match the requested subscriber email');
        
        console.log(`GetSubscriber by email: Retrieved subscriber ${results.email} with ID: ${results.id}`);
    }
};
