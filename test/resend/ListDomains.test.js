const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay } = require('./testUtils');

describe('ListDomains Component', function() {
    let context;
    let ListDomains;

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

        ListDomains = require(path.join(__dirname, '../../src/appmixer/resend/core/ListDomains/ListDomains.js'));

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
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    it('should list domains', async function() {
        await ListDomains.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out' || context.lastSent.outputPort === 'notFound', 'Should send to out or notFound port');

        if (context.lastSent.outputPort === 'out') {
            assert(context.lastSent.data, 'Response should contain data');
            if (context.lastSent.data.result && Array.isArray(context.lastSent.data.result)) {
                console.log('✓ Found', context.lastSent.data.result.length, 'domains');
                if (context.lastSent.data.result.length > 0) {
                    const domain = context.lastSent.data.result[0];
                    assert(typeof domain.id === 'string', 'Domain should have id');
                    assert(typeof domain.name === 'string', 'Domain should have name');
                    console.log('✓ First domain:', domain.name, '(ID:', domain.id + ')');
                }
            }
        } else {
            console.log('✓ No domains found (notFound port)');
        }
    });

    it('should handle empty domain list consistently', async function() {
        await ListDomains.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out' || context.lastSent.outputPort === 'notFound', 'Should send to appropriate port');
        console.log('✓ Domain list handled consistently');
    });
});
