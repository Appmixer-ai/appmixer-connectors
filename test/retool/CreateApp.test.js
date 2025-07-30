const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import utils
const utils = require('../utils');

describe('Retool CreateApp', function() {
    let context;

    beforeEach(function() {
        // Initialize context with authentication
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });
    });

    it('should create app successfully', async function() {
        this.timeout(10000);

        const appName = `Test App ${Date.now()}`;
        
        await context.sendJson({
            name: appName,
            description: 'Test app created by automated test'
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure
        assert(typeof result === 'object', 'Result should be an object');
        assert(typeof result.id === 'string' || typeof result.id === 'number', 'Result should have an id');
        assert(typeof result.name === 'string', 'Result should have a name');
        assert(result.name === appName, 'Created app should have the correct name');
    });

    it('should require name parameter', async function() {
        this.timeout(5000);

        try {
            await context.sendJson({
                description: 'Test app without name'
            }, 'in');
            
            assert.fail('Should have thrown an error for missing name');
        } catch (error) {
            assert(error.message.includes('App name is required'), 'Should throw appropriate error for missing name');
        }
    });

    it('should handle optional description', async function() {
        this.timeout(10000);

        const appName = `Test App No Description ${Date.now()}`;
        
        await context.sendJson({
            name: appName
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure
        assert(typeof result === 'object', 'Result should be an object');
        assert(typeof result.id === 'string' || typeof result.id === 'number', 'Result should have an id');
        assert(typeof result.name === 'string', 'Result should have a name');
        assert(result.name === appName, 'Created app should have the correct name');
    });

    it('should handle configuration parameter', async function() {
        this.timeout(10000);

        const appName = `Test App With Config ${Date.now()}`;
        const config = { theme: 'dark', layout: 'grid' };
        
        await context.sendJson({
            name: appName,
            description: 'Test app with configuration',
            configuration: config
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure
        assert(typeof result === 'object', 'Result should be an object');
        assert(typeof result.id === 'string' || typeof result.id === 'number', 'Result should have an id');
        assert(typeof result.name === 'string', 'Result should have a name');
        assert(result.name === appName, 'Created app should have the correct name');
    });
});
