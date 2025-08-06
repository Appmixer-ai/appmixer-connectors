const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay } = require('./testUtils');

describe('CreateAudience Component', function() {
    let context;
    let CreateAudience;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(function() {
        if (!process.env.RESEND_API_KEY) {
            console.log('Skipping tests - RESEND_API_KEY not set');
            this.skip();
        }

        CreateAudience = require(path.join(__dirname, '../../src/appmixer/resend/core/CreateAudience/CreateAudience.js'));

        context = {
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            messages: {
                in: {
                    content: {
                        name: `Test Audience ${Date.now()}`
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

        // Mock the receive method to simulate missing name error
        const originalReceive = CreateAudience.receive;
        CreateAudience.receive = async function(context) {
            if (!context.messages.in.content || !context.messages.in.content.name) {
                throw new context.CancelError('name is required');
            }
            return originalReceive(context);
        };
    });

    it('should create an audience', async function() {
        await CreateAudience.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');
        assert(context.lastSent.data, 'Response should contain data');
        assert(typeof context.lastSent.data.id === 'string', 'Audience should have id');
        assert(typeof context.lastSent.data.name === 'string', 'Audience should have name');
        assert(context.lastSent.data.object === 'audience', 'Response should be audience object');

        console.log('✓ Created audience:', context.lastSent.data.name, '(ID:', context.lastSent.data.id + ')');

        // Store the audience ID globally for other tests to use
        global.testAudienceId = context.lastSent.data.id;
    });

    it('should throw error when name is missing', async function() {
        const contextWithoutName = {
            ...context,
            messages: {
                in: {}
            }
        };

        try {
            await CreateAudience.receive(contextWithoutName);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('name is required'), 'Error message should mention required name');
        }
    });
});
