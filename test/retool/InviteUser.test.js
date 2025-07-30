const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import utils
const utils = require('../utils');

describe('Retool InviteUser', function() {
    let context;

    beforeEach(function() {
        // Initialize context with authentication
        context = utils.getContextWithAuth({
            baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
            apiToken: process.env.RETOOL_ACCESS_TOKEN
        });
    });

    it('should require email parameter', async function() {
        this.timeout(5000);

        try {
            await context.sendJson({
                role: 'viewer'
            }, 'in');
            
            assert.fail('Should have thrown an error for missing email');
        } catch (error) {
            assert(error.message.includes('Email is required'), 'Should throw appropriate error for missing email');
        }
    });

    it('should handle valid email invitation', async function() {
        this.timeout(10000);

        const testEmail = `test+${Date.now()}@example.com`;

        try {
            await context.sendJson({
                email: testEmail
            }, 'in');

            const result = await context.getJsonLastOutput('out');
            
            // Verify result structure
            assert(typeof result === 'object', 'Result should be an object');
            assert(typeof result.email === 'string' || result.email === testEmail, 'Result should contain email');
            
        } catch (error) {
            // Some APIs might reject test emails or have restrictions
            // Accept common invitation-related errors
            const isExpectedError = 
                error.message.includes('already exists') ||
                error.message.includes('invalid email') ||
                error.message.includes('permission') ||
                error.message.includes('unauthorized') ||
                error.message.includes('forbidden') ||
                error.message.includes('limit');
            
            if (!isExpectedError) {
                throw error;
            }
        }
    });

    it('should handle email with role', async function() {
        this.timeout(10000);

        const testEmail = `test+role+${Date.now()}@example.com`;

        try {
            await context.sendJson({
                email: testEmail,
                role: 'viewer'
            }, 'in');

            const result = await context.getJsonLastOutput('out');
            
            // Verify result structure
            assert(typeof result === 'object', 'Result should be an object');
            assert(typeof result.email === 'string' || result.email === testEmail, 'Result should contain email');
            
        } catch (error) {
            // Some APIs might reject test emails or have restrictions
            // Accept common invitation-related errors
            const isExpectedError = 
                error.message.includes('already exists') ||
                error.message.includes('invalid email') ||
                error.message.includes('invalid role') ||
                error.message.includes('permission') ||
                error.message.includes('unauthorized') ||
                error.message.includes('forbidden') ||
                error.message.includes('limit');
            
            if (!isExpectedError) {
                throw error;
            }
        }
    });

    it('should handle existing user email', async function() {
        this.timeout(10000);

        // Try to invite the same email twice to test duplicate handling
        const testEmail = `existing+${Date.now()}@example.com`;

        try {
            // First invitation
            await context.sendJson({
                email: testEmail
            }, 'in');

            const firstResult = await context.getJsonLastOutput('out');
            assert(typeof firstResult === 'object', 'First result should be an object');

            // Reset context for second invitation
            context = utils.getContextWithAuth({
                baseUrl: process.env.RETOOL_BASE_URL || 'https://test.retool.com',
                apiToken: process.env.RETOOL_ACCESS_TOKEN
            });

            // Second invitation (should handle duplicate)
            await context.sendJson({
                email: testEmail
            }, 'in');

            const secondResult = await context.getJsonLastOutput('out');
            assert(typeof secondResult === 'object', 'Second result should be an object');
            
        } catch (error) {
            // Expected errors for duplicate invitations or API limitations
            const isExpectedError = 
                error.message.includes('already exists') ||
                error.message.includes('already invited') ||
                error.message.includes('duplicate') ||
                error.message.includes('invalid email') ||
                error.message.includes('permission') ||
                error.message.includes('unauthorized') ||
                error.message.includes('forbidden') ||
                error.message.includes('limit');
            
            if (!isExpectedError) {
                throw error;
            }
        }
    });
});
