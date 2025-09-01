const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('./testUtils');

describe('ListApiKeys Component', function() {
    let context;
    let ListApiKeys;

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

        // Load the component
        ListApiKeys = require(path.join(__dirname, '../../src/appmixer/resend/core/ListApiKeys/ListApiKeys.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.RESEND_API_KEY, { content: {} });
    });

    it('should list API keys', async function() {
        await ListApiKeys.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out' || context.lastSent.outputPort === 'notFound', 'Should send to out or notFound port');

        if (context.lastSent.outputPort === 'out') {
            assert(context.lastSent.data, 'Response should contain data');
            if (context.lastSent.data.result && Array.isArray(context.lastSent.data.result)) {
                console.log('✓ Found', context.lastSent.data.result.length, 'API keys');
                if (context.lastSent.data.result.length > 0) {
                    const apiKey = context.lastSent.data.result[0];
                    assert(typeof apiKey.id === 'string', 'API key should have id');
                    assert(typeof apiKey.name === 'string', 'API key should have name');
                    assert(typeof apiKey.created_at === 'string', 'API key should have created_at');
                    console.log('✓ First API key:', apiKey.name, '(ID:', apiKey.id + ')');
                }
            }
        } else {
            console.log('✓ No API keys found (notFound port)');
        }
    });

    it('should return consistent structure even with empty list', async function() {
        await ListApiKeys.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out' || context.lastSent.outputPort === 'notFound', 'Should send to appropriate port');
        console.log('✓ API key list handled consistently');
    });
});
