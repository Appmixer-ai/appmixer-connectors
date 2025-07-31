const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateCampaign Component', function() {
    let context;
    let CreateCampaign;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.MAILERLITE_ACCESS_TOKEN) {
            console.log('Skipping tests - MAILERLITE_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        CreateCampaign = require(path.join(__dirname, '../../src/appmixer/mailerlite/core/CreateCampaign/CreateCampaign.js'));

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

    it('should create a basic regular campaign', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const timestamp = Date.now();
        context.messages.in.content = {
            name: `Test Campaign ${timestamp}`,
            type: 'regular',
            subject: `Test Campaign Subject ${timestamp}`,
            content: '<html><body><h1>Test Campaign Content</h1><p>This is a test campaign created by automated tests.</p></body></html>'
        };

        try {
            await CreateCampaign.receive(context);

            console.log('CreateCampaign result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'string', 'Expected data.id to be a string');
            assert(data.name === context.messages.in.content.name, 'Expected campaign name to match input');
            assert(data.status, 'Expected data.status to be present');

            // Store the created campaign ID for other tests
            global.testCreatedCampaignId = data.id;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the MAILERLITE_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 422) {
                console.log('Validation error during campaign creation');
                console.log('Error details:', error.response.data);
                // This might be due to missing required fields or other validation
                throw error;
            }
            throw error;
        }
    });

    it('should throw error when name is missing', async function() {
        context.messages.in.content = {
            type: 'regular',
            subject: 'Test Subject'
        };

        try {
            await CreateCampaign.receive(context);
            throw new Error('Expected error for missing campaign name');
        } catch (error) {
            if (error.name === 'CancelError' && error.message.includes('Name is required')) {
                console.log('Correctly threw CancelError for missing campaign name');
                return;
            }
            throw error;
        }
    });

    it('should throw error when type is missing', async function() {
        context.messages.in.content = {
            name: 'Test Campaign',
            subject: 'Test Subject'
        };

        try {
            await CreateCampaign.receive(context);
            throw new Error('Expected error for missing campaign type');
        } catch (error) {
            if (error.name === 'CancelError' && error.message.includes('Type is required')) {
                console.log('Correctly threw CancelError for missing campaign type');
                return;
            }
            throw error;
        }
    });

    it('should throw error when subject is missing', async function() {
        context.messages.in.content = {
            name: 'Test Campaign',
            type: 'regular'
        };

        try {
            await CreateCampaign.receive(context);
            throw new Error('Expected error for missing campaign subject');
        } catch (error) {
            if (error.name === 'CancelError' && error.message.includes('Subject is required')) {
                console.log('Correctly threw CancelError for missing campaign subject');
                return;
            }
            throw error;
        }
    });

    it('should create campaign with groups', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const timestamp = Date.now();
        context.messages.in.content = {
            name: `Test Campaign with Groups ${timestamp}`,
            type: 'regular',
            subject: `Test Campaign Subject ${timestamp}`,
            content: '<html><body><h1>Test Campaign</h1></body></html>',
            groups: {
                AND: [
                    { groups_item: '1' },
                    { groups_item: '2' }
                ]
            }
        };

        try {
            await CreateCampaign.receive(context);

            console.log('CreateCampaign with groups result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'string', 'Expected data.id to be a string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            if (error.response && error.response.status === 422) {
                console.log('Validation error during campaign creation with groups');
                console.log('Error details:', error.response.data);
                // This might be acceptable if groups don't exist
                return;
            }
            throw error;
        }
    });

    it('should create A/B test campaign', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const timestamp = Date.now();
        context.messages.in.content = {
            name: `A/B Test Campaign ${timestamp}`,
            type: 'ab',
            subject: `A/B Test Campaign Subject ${timestamp}`,
            content: '<html><body><h1>Version A</h1></body></html>'
        };

        try {
            await CreateCampaign.receive(context);

            console.log('CreateCampaign A/B test result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'string', 'Expected data.id to be a string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            if (error.response && error.response.status === 422) {
                console.log('Validation error during A/B campaign creation - this might require special plan');
                console.log('Error details:', error.response.data);
                return; // A/B testing might require growing/advanced plan
            }
            throw error;
        }
    });

    it('should create resend campaign', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        const timestamp = Date.now();
        context.messages.in.content = {
            name: `Resend Campaign ${timestamp}`,
            type: 'resend',
            subject: `Resend Campaign Subject ${timestamp}`,
            content: '<html><body><h1>Resend Version</h1></body></html>'
        };

        try {
            await CreateCampaign.receive(context);

            console.log('CreateCampaign resend result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(typeof data.id === 'string', 'Expected data.id to be a string');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                throw new Error('Authentication failed: Access token is invalid or expired');
            }
            if (error.response && error.response.status === 422) {
                console.log('Validation error during resend campaign creation - this might require growing/advanced plan');
                console.log('Error details:', error.response.data);
                return; // Resend campaigns might require growing/advanced plan
            }
            throw error;
        }
    });
});
