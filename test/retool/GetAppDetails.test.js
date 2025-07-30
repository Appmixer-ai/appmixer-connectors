const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import utils
const utils = require('../utils');

describe('Retool GetAppDetails', function() {
    let context;
    let testAppId;

    before(async function() {
        // Create a test app first to use in our tests
        this.timeout(10000);
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });

        try {
            // Try to create a test app
            await context.sendJson({
                name: `Test App for Details ${Date.now()}`,
                description: 'Test app for GetAppDetails test'
            }, 'in');

            const createResult = await context.getJsonLastOutput('out');
            testAppId = createResult.id;
        } catch (error) {
            // If we can't create an app, try to find an existing one
            context = utils.getContextWithAuth({
                baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
                apiToken: process.env.RETOOL_ACCESS_TOKEN
            });

            await context.sendJson({
                search: '',
                outputType: 'first'
            }, 'in');

            try {
                const findResult = await context.getJsonLastOutput('out');
                testAppId = findResult.id;
            } catch (findError) {
                console.log('No existing apps found, skipping GetAppDetails tests');
                testAppId = null;
            }
        }
    });

    beforeEach(function() {
        if (!testAppId) {
            this.skip();
        }
        
        // Initialize context with authentication for each test
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });
    });

    it('should get app details successfully', async function() {
        this.timeout(10000);

        await context.sendJson({
            appId: testAppId
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure
        assert(typeof result === 'object', 'Result should be an object');
        assert(typeof result.id === 'string' || typeof result.id === 'number', 'Result should have an id');
        assert(typeof result.name === 'string', 'Result should have a name');
        assert(result.id == testAppId, 'Result should have the correct app ID');
    });

    it('should require appId parameter', async function() {
        this.timeout(5000);

        try {
            await context.sendJson({}, 'in');
            
            assert.fail('Should have thrown an error for missing appId');
        } catch (error) {
            assert(error.message.includes('App ID is required'), 'Should throw appropriate error for missing appId');
        }
    });

    it('should handle invalid app ID', async function() {
        this.timeout(10000);

        try {
            await context.sendJson({
                appId: 'invalid-app-id-12345'
            }, 'in');
            
            // If it doesn't throw an error, the API might return null or empty result
            const result = await context.getJsonLastOutput('out');
            // Allow for different API behaviors - some return null, others throw errors
            if (result !== null) {
                assert(typeof result === 'object', 'Result should be an object or null');
            }
        } catch (error) {
            // This is expected for invalid app IDs
            assert(error.message.includes('404') || error.message.includes('not found') || error.message.includes('Not Found'), 
                   'Should throw appropriate error for invalid app ID');
        }
    });
});
