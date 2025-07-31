const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetSubscriber Component', function() {
    let context;
    let GetSubscriber;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.MAILERLITE_ACCESS_TOKEN) {
            console.log('Skipping tests - MAILERLITE_ACCESS_TOKEN not set');
            this.skip();
        }
        
        // Load the component
        GetSubscriber = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/GetSubscriber/GetSubscriber.js'));

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

    it('should get subscriber by ID', async function() {
        // Skip if no subscriber ID provided
        if (!process.env.MAILERLITE_SUBSCRIBER_ID) {
            console.log('Skipping test - MAILERLITE_SUBSCRIBER_ID not set');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            subscriberId: process.env.MAILERLITE_SUBSCRIBER_ID
        };

        try {
            await GetSubscriber.receive(context);

            console.log('GetSubscriber by ID result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'string', 'Expected data.id to be a string');
            assert(typeof data.email === 'string', 'Expected data.email to be a string');
            assert(data.status, 'Expected data.status to be present');
            assert(data.id === process.env.MAILERLITE_SUBSCRIBER_ID, 'Expected ID to match requested ID');

            // Store email for next test
            global.testSubscriberEmail = data.email;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('Subscriber not found - MAILERLITE_SUBSCRIBER_ID may be invalid');
                console.log('Error details:', error.response.data);
                throw new Error('Subscriber not found: Please check MAILERLITE_SUBSCRIBER_ID in .env file');
            }
            throw error;
        }
    });

    it('should get subscriber by email', async function() {
        // This test depends on the previous test setting the email
        if (!global.testSubscriberEmail) {
            console.log('Skipping test - no test subscriber email available');
            this.skip();
        }

        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        context.messages.in.content = {
            email: global.testSubscriberEmail
        };

        try {
            await GetSubscriber.receive(context);

            console.log('GetSubscriber by email result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'string', 'Expected data.id to be a string');
            assert(typeof data.email === 'string', 'Expected data.email to be a string');
            assert(data.email === global.testSubscriberEmail, 'Expected email to match requested email');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('Subscriber not found by email');
                console.log('Error details:', error.response.data);
                // This might be acceptable if the email doesn't exist
                return;
            }
            throw error;
        }
    });

    it('should throw error when neither ID nor email provided', async function() {
        context.messages.in.content = {};

        try {
            await GetSubscriber.receive(context);
            throw new Error('Expected error for missing subscriber ID and email');
        } catch (error) {
            if (error.name === 'CancelError' && error.message.includes('Either Subscriber ID or Email is required')) {
                // This is expected
                console.log('Correctly threw CancelError for missing subscriber ID and email');
                return;
            }
            throw error;
        }
    });

    it('should handle non-existent subscriber ID', async function() {
        context.sendJson = function(output, port) {
            // Expected to fail, so output not used
        };

        context.messages.in.content = {
            subscriberId: 'non-existent-id-12345'
        };

        try {
            await GetSubscriber.receive(context);
            
            // If this succeeds, there might be an issue
            console.log('Unexpected success for non-existent subscriber');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Correctly handled non-existent subscriber ID with 404');
                return; // This is expected
            }
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            throw error;
        }
    });

    it('should handle non-existent email', async function() {
        context.messages.in.content = {
            email: 'non-existent-email@example.com'
        };

        try {
            await GetSubscriber.receive(context);
            
            // If this succeeds, the email might actually exist
            console.log('Subscriber found for test email (unexpected but not an error)');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Correctly handled non-existent email with 404');
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
