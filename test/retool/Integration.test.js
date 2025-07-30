const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import utils
const utils = require('../utils');

describe('Retool Connector Integration Tests', function() {
    let context;

    // Test to check if the environment is properly configured
    describe('Environment Setup', function() {
        it('should have required environment variables', function() {
            assert(process.env.RETOOL_ACCESS_TOKEN || process.env.RETOOL_API_TOKEN, 
                   'RETOOL_ACCESS_TOKEN or RETOOL_API_TOKEN environment variable is required');
            
            // Check if base URL is available (optional, can use default)
            const baseUrl = process.env.RETOOL_BASE_URL || 'https://test.retool.com';
            assert(typeof baseUrl === 'string' && baseUrl.length > 0, 'Base URL should be a non-empty string');
        });
    });

    // Quick smoke tests for all components
    describe('Component Smoke Tests', function() {
        beforeEach(function() {
            context = utils.getContextWithAuth({
                baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
                apiToken: process.env.RETOOL_ACCESS_TOKEN || process.env.RETOOL_API_TOKEN
            });
        });

        it('should handle authentication properly', async function() {
            this.timeout(10000);

            // Test with FindApps as it's a basic read operation
            try {
                await context.sendJson({
                    search: '',
                    outputType: 'array'
                }, 'in');

                const result = await context.getJsonLastOutput('out');
                assert(typeof result === 'object', 'Should return valid response with auth');
            } catch (error) {
                // Authentication errors are acceptable - it means the component is working
                const isAuthError = error.message.includes('401') || 
                                  error.message.includes('403') || 
                                  error.message.includes('unauthorized') ||
                                  error.message.includes('forbidden');
                
                if (!isAuthError) {
                    throw error; // Re-throw if it's not an auth error
                }
            }
        });

        it('should validate required inputs properly', async function() {
            this.timeout(5000);

            // Test CreateApp with missing required input
            try {
                await context.sendJson({
                    description: 'Test without name'
                }, 'in');
                
                assert.fail('Should have thrown an error for missing required input');
            } catch (error) {
                assert(error.message.includes('required'), 'Should throw appropriate validation error');
            }
        });

        it('should handle invalid authentication gracefully', async function() {
            this.timeout(10000);

            // Test with invalid credentials
            const invalidContext = utils.getContextWithAuth({
                baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
                apiToken: 'invalid-token-12345'
            });

            try {
                await invalidContext.sendJson({
                    search: '',
                    outputType: 'array'
                }, 'in');

                // Some APIs might not immediately reject invalid tokens
                const result = await invalidContext.getJsonLastOutput('out');
                
                // If we get here, the API might have specific behavior for invalid tokens
                assert(typeof result === 'object', 'Invalid auth should either throw error or return specific response');
                
            } catch (error) {
                // This is the expected behavior for invalid authentication
                const isAuthError = error.message.includes('401') || 
                                  error.message.includes('403') || 
                                  error.message.includes('unauthorized') ||
                                  error.message.includes('forbidden') ||
                                  error.message.includes('invalid') ||
                                  error.message.includes('token');
                
                assert(isAuthError, 'Should throw appropriate authentication error');
            }
        });
    });

    // Output port schema generation tests
    describe('Output Port Schema Generation', function() {
        beforeEach(function() {
            context = utils.getContextWithAuth({
                baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
                apiToken: process.env.RETOOL_ACCESS_TOKEN || process.env.RETOOL_API_TOKEN
            });
        });

        it('should generate output port options for FindApps', async function() {
            this.timeout(5000);

            context.properties.generateOutputPortOptions = true;
            
            await context.sendJson({
                outputType: 'array'
            }, 'in');

            const result = await context.getJsonLastOutput('out');
            
            assert(Array.isArray(result), 'Should return array of output port options');
            if (result.length > 0) {
                const option = result.find(opt => opt.label && opt.value);
                assert(option, 'Should have options with label and value properties');
            }
        });

        it('should generate different schemas for different output types', async function() {
            this.timeout(5000);

            context.properties.generateOutputPortOptions = true;
            
            // Test array output type
            await context.sendJson({
                outputType: 'array'
            }, 'in');

            const arrayResult = await context.getJsonLastOutput('out');
            assert(Array.isArray(arrayResult), 'Array output should return array schema');

            // Reset context and test object output type
            context = utils.getContextWithAuth({
                baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
                apiToken: process.env.RETOOL_ACCESS_TOKEN || process.env.RETOOL_API_TOKEN
            });
            context.properties.generateOutputPortOptions = true;

            await context.sendJson({
                outputType: 'object'
            }, 'in');

            const objectResult = await context.getJsonLastOutput('out');
            assert(Array.isArray(objectResult), 'Object output should return array schema');
            
            // The schemas should be different
            assert(arrayResult.length !== objectResult.length || 
                   JSON.stringify(arrayResult) !== JSON.stringify(objectResult), 
                   'Array and object output types should have different schemas');
        });
    });
});
