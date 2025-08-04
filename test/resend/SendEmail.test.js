const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const sinon = require('sinon');
const { rateLimitDelay } = require('./testUtils');

describe('SendEmail Component', function() {
    let context;
    let SendEmail;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting (2 requests per second)
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(function() {
        // Skip all tests if the API key is not set
        if (!process.env.RESEND_API_KEY) {
            console.log('Skipping tests - RESEND_API_KEY not set');
            this.skip();
        }

        // Load the component
        SendEmail = require(path.join(__dirname, '../../src/appmixer/resend/email/SendEmail/SendEmail.js'));

        // Mock context
        context = {
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            messages: {
                in: {
                    content: {
                        from: 'onboarding@resend.dev',
                        to: ['auth@appmixer.com'],
                        subject: 'Test Email from Appmixer Resend Connector',
                        html: '<h1>Hello from Appmixer!</h1><p>This is a test email sent through the Resend API.</p>',
                        text: 'Hello from Appmixer! This is a test email sent through the Resend API.'
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: (data, outputPort) => {
                return { data, outputPort };
            },
            CancelError: class CancelError extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        // Mock the receive method to validate required fields
        const originalReceive = SendEmail.receive;
        SendEmail.receive = async function(context) {
            context.CancelError = class CancelError extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            };
            return originalReceive(context);
        };
    });

    // Update test setup for successful email test
    it('should send an email successfully', async () => {
        // Use the context from before() and override only what is needed
        const testContext = { ...context, sendJson: sinon.stub() };
        testContext.messages = {
            in: {
                content: {
                    from: 'onboarding@resend.dev',
                    to: ['auth@appmixer.com'],
                    subject: 'Test Subject',
                    body: 'Test Body',
                    html: '<h1>Hello from Appmixer!</h1><p>This is a test email sent through the Resend API.</p>'
                }
            }
        };

        await SendEmail.receive(testContext);

        sinon.assert.calledOnce(testContext.sendJson);
    });

    // Adjust assertions for missing to field
    it('should fail without required to field', async function() {
        const testContext = { ...context };
        testContext.messages = {
            in: {
                content: { from: 'test@example.com', subject: 'Test' }
            }
        };

        try {
            await SendEmail.receive(testContext);

            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('To email is required!'), 'Should mention to field');
        }
    });

    // Adjust assertions for missing subject field
    it('should fail without required subject field', async function() {
        const testContext = { ...context };
        testContext.messages = {
            in: {
                content: { from: 'test@example.com', to: ['test@example.com'] }
            }
        };

        try {
            await SendEmail.receive(testContext);

            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Subject is required!'), 'Should mention subject field');
        }
    });
});
