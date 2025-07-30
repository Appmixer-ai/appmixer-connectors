const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import utils
const utils = require('../utils');

describe('Retool FindUsers', function() {
    let context;

    beforeEach(function() {
        // Initialize context with authentication
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });
    });

    it('should find users successfully', async function() {
        this.timeout(10000);

        // Test basic functionality
        await context.sendJson({
            search: '',
            outputType: 'array'
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure
        assert(typeof result === 'object', 'Result should be an object');
        assert(Array.isArray(result.result) || typeof result.result === 'undefined', 'Result should contain array or be empty');
        assert(typeof result.count === 'number', 'Count should be a number');
    });

    it('should handle search parameter', async function() {
        this.timeout(10000);

        await context.sendJson({
            search: 'test',
            outputType: 'array'
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify result structure
        assert(typeof result === 'object', 'Result should be an object');
        assert(typeof result.count === 'number', 'Count should be a number');
    });

    it('should generate output port options', async function() {
        this.timeout(5000);

        context.properties.generateOutputPortOptions = true;
        
        await context.sendJson({
            outputType: 'array'
        }, 'in');

        const result = await context.getJsonLastOutput('out');
        
        // Verify output port options structure
        assert(Array.isArray(result), 'Result should be an array of output port options');
        if (result.length > 0) {
            assert(typeof result[0].label === 'string', 'Each option should have a label');
            assert(typeof result[0].value === 'string', 'Each option should have a value');
        }
    });

    it('should handle different output types', async function() {
        this.timeout(10000);

        // Test array output type
        await context.sendJson({
            search: '',
            outputType: 'array'
        }, 'in');

        let result = await context.getJsonLastOutput('out');
        assert(typeof result === 'object', 'Array output should be an object');
        assert(typeof result.count === 'number', 'Array output should have count');

        // Reset context for next test
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });

        // Test first output type (if users exist)
        await context.sendJson({
            search: '',
            outputType: 'first'
        }, 'in');

        // This might throw a CancelError if no users exist, which is expected
        try {
            result = await context.getJsonLastOutput('out');
            assert(typeof result === 'object', 'First output should be an object');
            assert(typeof result.index === 'number', 'First output should have index');
            assert(typeof result.count === 'number', 'First output should have count');
        } catch (error) {
            // If no users exist, expect CancelError
            assert(error.message.includes('No records available'), 'Should throw appropriate error when no users exist');
        }
    });
});
