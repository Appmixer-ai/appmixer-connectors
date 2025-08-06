const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay } = require('./testUtils');

describe('ListAudiences Component', function() {
    let context;
    let ListAudiences;

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

        ListAudiences = require(path.join(__dirname, '../../src/appmixer/resend/core/ListAudiences/ListAudiences.js'));

        context = {
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            properties: {},
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: function(data, outputPort) {
                this.lastSent = { data, outputPort };
                return Promise.resolve();
            },
            lock: function() {
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

    it('should list audiences', async function() {
        await ListAudiences.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out' || context.lastSent.outputPort === 'notFound', 'Should send to out or notFound port');

        if (context.lastSent.outputPort === 'out') {
            assert(context.lastSent.data, 'Response should contain data');
            if (context.lastSent.data.result && Array.isArray(context.lastSent.data.result)) {
                console.log('✓ Found', context.lastSent.data.result.length, 'audiences');
                if (context.lastSent.data.result.length > 0) {
                    const audience = context.lastSent.data.result[0];
                    assert(typeof audience.id === 'string', 'Audience should have id');
                    assert(typeof audience.name === 'string', 'Audience should have name');
                    console.log('✓ First audience:', audience.name, '(ID:', audience.id + ')');
                }
            }
        } else {
            console.log('✓ No audiences found (notFound port)');
        }
    });

    it('should handle empty audience list consistently', async function() {
        await ListAudiences.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out' || context.lastSent.outputPort === 'notFound', 'Should send to appropriate port');
        console.log('✓ Audience list handled consistently');
    });
});
