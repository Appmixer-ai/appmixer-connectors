const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import utils
const utils = require('../utils');

describe('Retool UpdateApp', function() {
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
                name: `Test App for Update ${Date.now()}`,
                description: 'Test app for UpdateApp test'
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
                console.log('No existing apps found, skipping UpdateApp tests');
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

    it('should update app successfully', async function() {
        this.timeout(10000);

        const updatedName = `Updated Test App ${Date.now()}`;
        
        await context.sendJson({
            app_id: testAppId,
            name: updatedName,
            description: 'Updated description for test app'
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure - update components should return empty object
        assert(typeof result === 'object', 'Result should be an object');
        assert(Object.keys(result).length === 0, 'Update result should be empty object');
    });

    it('should require app_id parameter', async function() {
        this.timeout(5000);

        try {
            await context.sendJson({
                name: 'Updated name without ID'
            }, 'in');
            
            assert.fail('Should have thrown an error for missing app_id');
        } catch (error) {
            assert(error.message.includes('App ID is required'), 'Should throw appropriate error for missing app_id');
        }
    });

    it('should require at least one field to update', async function() {
        this.timeout(5000);

        try {
            await context.sendJson({
                app_id: testAppId
            }, 'in');
            
            assert.fail('Should have thrown an error for no update fields');
        } catch (error) {
            assert(error.message.includes('At least one field'), 'Should throw appropriate error for no update fields');
        }
    });

    it('should handle partial updates', async function() {
        this.timeout(10000);

        // Test updating only name
        await context.sendJson({
            app_id: testAppId,
            name: `Partially Updated App ${Date.now()}`
        }, 'in');

        let result = await context.getJsonLastOutput('out');
        assert(typeof result === 'object', 'Result should be an object');
        assert(Object.keys(result).length === 0, 'Update result should be empty object');

        // Reset context for next test
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });

        // Test updating only description
        await context.sendJson({
            app_id: testAppId,
            description: 'Only description updated'
        }, 'in');

        result = await context.getJsonLastOutput('out');
        assert(typeof result === 'object', 'Result should be an object');
        assert(Object.keys(result).length === 0, 'Update result should be empty object');
    });

    it('should handle invalid app ID', async function() {
        this.timeout(10000);

        try {
            await context.sendJson({
                app_id: 'invalid-app-id-12345',
                name: 'Updated name for invalid app'
            }, 'in');
            
            // Some APIs might not throw an error but return successfully
            const result = await context.getJsonLastOutput('out');
            assert(typeof result === 'object', 'Result should be an object');
            
        } catch (error) {
            // This is expected for invalid app IDs
            assert(error.message.includes('404') || error.message.includes('not found') || error.message.includes('Not Found'), 
                   'Should throw appropriate error for invalid app ID');
        }
    });
});
