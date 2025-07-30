const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import utils
const utils = require('../utils');

describe('Retool RunQuery', function() {
    let context;

    beforeEach(function() {
        // Initialize context with authentication
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });
    });

    it('should require app_id parameter', async function() {
        this.timeout(5000);

        try {
            await context.sendJson({
                query_id: 'test-query-id'
            }, 'in');
            
            assert.fail('Should have thrown an error for missing app_id');
        } catch (error) {
            assert(error.message.includes('App ID is required'), 'Should throw appropriate error for missing app_id');
        }
    });

    it('should require query_id parameter', async function() {
        this.timeout(5000);

        try {
            await context.sendJson({
                app_id: 'test-app-id'
            }, 'in');
            
            assert.fail('Should have thrown an error for missing query_id');
        } catch (error) {
            assert(error.message.includes('Query ID is required'), 'Should throw appropriate error for missing query_id');
        }
    });

    it('should handle invalid app or query ID', async function() {
        this.timeout(10000);

        try {
            await context.sendJson({
                app_id: 'invalid-app-id',
                query_id: 'invalid-query-id'
            }, 'in');
            
            // If no error is thrown, the API might return some result
            const result = await context.getJsonLastOutput('out');
            assert(typeof result === 'object', 'Result should be an object');
            
        } catch (error) {
            // This is expected for invalid IDs
            assert(
                error.message.includes('404') || 
                error.message.includes('not found') || 
                error.message.includes('Not Found') ||
                error.message.includes('does not exist') ||
                error.message.includes('unauthorized'),
                'Should throw appropriate error for invalid IDs'
            );
        }
    });

    it('should handle optional parameters', async function() {
        this.timeout(10000);

        try {
            await context.sendJson({
                app_id: 'test-app-id',
                query_id: 'test-query-id',
                parameters: { param1: 'value1', param2: 'value2' }
            }, 'in');
            
            // If no error is thrown, the API might return some result
            const result = await context.getJsonLastOutput('out');
            assert(typeof result === 'object', 'Result should be an object');
            
        } catch (error) {
            // This is expected for test/invalid IDs
            assert(
                error.message.includes('404') || 
                error.message.includes('not found') || 
                error.message.includes('Not Found') ||
                error.message.includes('does not exist') ||
                error.message.includes('unauthorized'),
                'Should throw appropriate error for test IDs'
            );
        }
    });

    // Note: This test would require actual valid app and query IDs
    // which we don't have in a test environment, so we'll skip it
    it.skip('should run query successfully with valid IDs', async function() {
        this.timeout(15000);

        // This would require real app and query IDs from the test environment
        const validAppId = process.env.RETOOL_TEST_APP_ID;
        const validQueryId = process.env.RETOOL_TEST_QUERY_ID;

        if (!validAppId || !validQueryId) {
            this.skip();
        }

        await context.sendJson({
            app_id: validAppId,
            query_id: validQueryId
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure
        assert(typeof result === 'object', 'Result should be an object');
        // Query results structure will vary based on the actual query
    });
});
