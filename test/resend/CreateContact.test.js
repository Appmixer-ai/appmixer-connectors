const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay } = require('./testUtils');

describe('CreateContact Component', function() {
    let context;
    let CreateContact;
    let CreateAudience;
    let testAudienceId;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API key is not set
        if (!process.env.RESEND_API_KEY) {
            console.log('Skipping tests - RESEND_API_KEY not set');
            this.skip();
        }

        // Load the components
        CreateContact = require(path.join(__dirname, '../../src/appmixer/resend/core/CreateContact/CreateContact.js'));
        CreateAudience = require(path.join(__dirname, '../../src/appmixer/resend/core/CreateAudience/CreateAudience.js'));

        // Create a test audience first
        const audienceContext = {
            messages: {
                in: {
                    content: {
                        name: `Test Audience for Contacts ${Date.now()}`
                    }
                }
            },
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: function(data, outputPort) {
                this.lastSent = { data, outputPort };
                return Promise.resolve();
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        console.log('Debug: audienceContext before calling CreateAudience.receive:', audienceContext);
        await CreateAudience.receive(audienceContext);
        console.log('Debug: audienceContext after calling CreateAudience.receive:', audienceContext);
        console.log('Debug: audienceContext.lastSent:', audienceContext.lastSent);
        testAudienceId = audienceContext.lastSent.data.id;
        console.log('✓ Created test audience for contacts:', testAudienceId);

        // Mock context
        context = {
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            messages: {
                in: {
                    content: {
                        audience_id: testAudienceId,
                        email: 'test@example.com',
                        first_name: 'Test',
                        last_name: 'User',
                        unsubscribed: false
                    }
                }
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: function(data, port) {
                this.sent = { data, port };
                return Promise.resolve();
            }
        };
    });

    it('should create a contact with all fields', async function() {

        await CreateContact.receive(context);

        assert(context.sent, 'No data was sent to output port');
        assert.strictEqual(context.sent.port, 'out');
        assert(context.sent.data.id, 'Response should contain contact ID');
        assert.strictEqual(context.sent.data.object, 'contact');
    });

    it('should create a contact with required fields only', async function() {

        const minimalContext = {
            ...context,
            messages: {
                in: {
                    content: {
                        audience_id: testAudienceId,
                        email: 'minimal@example.com'
                    }
                }
            }
        };

        await CreateContact.receive(minimalContext);

        assert(minimalContext.sent, 'No data was sent to output port');
        assert.strictEqual(minimalContext.sent.port, 'out');
        assert(minimalContext.sent.data.id, 'Response should contain contact ID');
        assert.strictEqual(minimalContext.sent.data.object, 'contact');
    });

    it('should throw error when audience_id is missing', async function() {

        const invalidContext = {
            ...context,
            messages: {
                in: {
                    content: {
                        email: 'test@example.com'
                    }
                }
            }
        };

        try {
            await CreateContact.receive(invalidContext);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError);
            assert.strictEqual(error.message, 'Audience ID is required!');
        }
    });

    it('should throw error when email is missing', async function() {

        const invalidContext = {
            ...context,
            messages: {
                in: {
                    content: {
                        audience_id: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
                    }
                }
            }
        };

        try {
            await CreateContact.receive(invalidContext);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError);
            assert.strictEqual(error.message, 'Email is required!');
        }
    });
});
