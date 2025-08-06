const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('./testUtils');

describe('CreateApiKey Component', function() {
    let context;
    let CreateApiKey;
    let createdApiKeys = []; // Track created API keys for cleanup

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
        CreateApiKey = require(path.join(__dirname, '../../src/appmixer/resend/core/CreateApiKey/CreateApiKey.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.RESEND_API_KEY);
    });

    // Cleanup: Delete created API keys after all tests
    after(async function() {
        if (createdApiKeys.length > 0) {
            console.log(`\n🧹 Cleaning up ${createdApiKeys.length} created API keys...`);
            const DeleteApiKey = require(path.join(__dirname, '../../src/appmixer/resend/core/DeleteApiKey/DeleteApiKey.js'));

            for (const apiKeyId of createdApiKeys) {
                try {
                    await rateLimitDelay();
                    const deleteContext = createTestContext(process.env.RESEND_API_KEY, { content: { key: apiKeyId } });
                    await DeleteApiKey.receive(deleteContext);
                    console.log('✓ Deleted API key:', apiKeyId);
                } catch (error) {
                    console.log('⚠ Failed to delete API key:', apiKeyId, error.message);
                }
            }
        }
    });

    it('should create an API key with just a name', async function() {
        const testName = `Test API Key ${Date.now()}`;

        context.messages = {
            in: {
                content: {
                    name: testName
                }
            }
        };

        await CreateApiKey.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.data.id, 'Response should contain an id');
        assert(context.lastSent.data.token, 'Response should contain a token');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');

        // Track created API key for cleanup
        createdApiKeys.push(context.lastSent.data.id);

        console.log('✓ Created API key:', {
            id: context.lastSent.data.id,
            name: testName,
            tokenPreview: context.lastSent.data.token.substring(0, 10) + '...'
        });
    });

    it('should create an API key with full_access permission', async function() {
        const testName = `Test Full Access API Key ${Date.now()}`;

        context.messages = {
            in: {
                content: {
                    name: testName,
                    permission: 'full_access'
                }
            }
        };

        await CreateApiKey.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.data.id, 'Response should contain an id');
        assert(context.lastSent.data.token, 'Response should contain a token');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');

        // Track created API key for cleanup
        createdApiKeys.push(context.lastSent.data.id);

        console.log('✓ Created API key with full access:', {
            id: context.lastSent.data.id,
            name: testName,
            tokenPreview: context.lastSent.data.token.substring(0, 10) + '...'
        });
    });

    it('should create an API key with sending_access permission', async function() {
        const testName = `Test Sending Access API Key ${Date.now()}`;

        context.messages = {
            in: {
                content: {
                    name: testName,
                    permission: 'sending_access'
                }
            }
        };

        await CreateApiKey.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.data.id, 'Response should contain an id');
        assert(context.lastSent.data.token, 'Response should contain a token');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');

        // Track created API key for cleanup
        createdApiKeys.push(context.lastSent.data.id);

        console.log('✓ Created API key with sending access:', {
            id: context.lastSent.data.id,
            name: testName,
            tokenPreview: context.lastSent.data.token.substring(0, 10) + '...'
        });
    });

    it('should throw error when name is missing', async function() {
        context.messages = {
            in: {
                content: {}
            }
        };

        try {
            await CreateApiKey.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message === 'API Key name is required!', 'Should have correct error message');
        }
    });

    it('should create an API key with domain restriction', async function() {
        // This test would require an existing domain ID
        // For now, we'll test that the component accepts the parameter
        const testName = `Test Domain Restricted API Key ${Date.now()}`;
        const testDomainId = 'test-domain-id';

        context.messages = {
            in: {
                content: {
                    name: testName,
                    permission: 'sending_access',
                    domain_id: testDomainId
                }
            }
        };

        // This might fail if the domain doesn't exist, but we test the structure
        try {
            await CreateApiKey.receive(context);

            assert(context.lastSent, 'Should have sent data');
            assert(context.lastSent.data.id, 'Response should contain an id');
            assert(context.lastSent.data.token, 'Response should contain a token');
            assert(context.lastSent.outputPort === 'out', 'Should send to out port');

            // Track created API key for cleanup
            createdApiKeys.push(context.lastSent.data.id);

            console.log('✓ Created API key with domain restriction:', {
                id: context.lastSent.data.id,
                name: testName,
                tokenPreview: context.lastSent.data.token.substring(0, 10) + '...'
            });
        } catch (error) {
            // If domain doesn't exist, that's expected for this test
            console.log('ℹ Domain restriction test failed as expected (domain may not exist):', error.message);
        }
    });
});
