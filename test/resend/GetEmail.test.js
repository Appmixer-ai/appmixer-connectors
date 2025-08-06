const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay } = require('./testUtils');

describe('GetEmail Component', function() {
    let context;
    let GetEmail;
    let emailId;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting (2 requests per second)
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
        GetEmail = require(path.join(__dirname, '../../src/appmixer/resend/email/GetEmail/GetEmail.js'));

        // Use a previously sent email ID to avoid rate limiting
        // This should be updated with a valid email ID from your Resend account
        emailId = 'ddcc4dfe-1cb3-4549-87a3-b1737aa5cc32'; // Use an existing email ID
        console.log('✓ Using test email with ID:', emailId);

        // Mock context for GetEmail
        context = {
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            messages: {
                in: {
                    content: {
                        id: emailId
                    }
                }
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
    });

    it('should retrieve email details successfully', async function() {
        await GetEmail.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');
        assert(context.lastSent.data, 'Result should have data');
        assert(context.lastSent.data.id === emailId, 'Should return the correct email ID');
        assert(typeof context.lastSent.data.from === 'string', 'Should have from field');
        assert(Array.isArray(context.lastSent.data.to), 'Should have to field as array');
        assert(typeof context.lastSent.data.subject === 'string', 'Should have subject field');

        console.log('✓ Retrieved email details:', JSON.stringify(context.lastSent.data, null, 2));
    });

    it('should fail without email ID', async function() {
        const testContext = { ...context };
        testContext.messages = { in: { content: {} } };

        try {
            await GetEmail.receive(testContext);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Email ID is required'), 'Should mention email ID requirement');
        }
    });
});
