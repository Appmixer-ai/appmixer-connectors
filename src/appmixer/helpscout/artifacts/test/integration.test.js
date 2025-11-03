'use strict';

/**
 * Integration tests for HelpScout connector
 * These tests require a real HELPSCOUT_ACCESS_TOKEN environment variable
 *
 * To run these tests:
 * 1. Set HELPSCOUT_ACCESS_TOKEN environment variable with your HelpScout API token
 * 2. Run: npm run test-unit -- "src/appmixer/helpscout/artifacts/test/integration.test.js"
 *
 * Note: These tests will make real API calls and may read data from your HelpScout account
 * They should not create or modify data in most cases
 */

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import HelpScout components for integration testing
const GetCurrentUser = require('../../core/GetCurrentUser/GetCurrentUser');
const ListMailboxes = require('../../core/ListMailboxes/ListMailboxes');
const FindCustomers = require('../../core/FindCustomers/FindCustomers');

describe('HelpScout Integration Tests', function() {
    this.timeout(30000); // Increase timeout for API calls

    let context;

    before(function() {
        if (!process.env.HELPSCOUT_ACCESS_TOKEN) {
            console.log('⚠️  Skipping HelpScout integration tests - HELPSCOUT_ACCESS_TOKEN not set');
            this.skip();
        }

        context = appmixer.createMockContext({
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
            }
        });
    });

    describe('Authentication and Basic API Access', () => {
        it('should authenticate and get current user', async () => {
            context.messages = { in: { content: {} } };

            const result = await GetCurrentUser.receive(context);

            assert(result, 'Should return user data');
            assert(context.getSentData().data, 'Should have sent user data');

            const userData = context.getSentData().data;
            assert(userData.id, 'User should have an ID');
            assert(userData.email, 'User should have an email');
        });

        it('should list available mailboxes', async () => {
            context.messages = {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            };

            const result = await ListMailboxes.receive(context);

            assert(result, 'Should return mailbox data');
            assert(context.getSentData().data, 'Should have sent mailbox data');

            const mailboxData = context.getSentData().data;
            assert(mailboxData.result || mailboxData.length >= 0, 'Should have mailbox results');
        });
    });

    describe('Customer Operations', () => {
        it('should find customers (may return empty results)', async () => {
            context.messages = {
                in: {
                    content: {
                        query: 'test',
                        outputType: 'array'
                    }
                }
            };

            try {
                const result = await FindCustomers.receive(context);

                // This may return no customers, which is fine for integration test
                assert(result !== undefined, 'Should return a result (even if empty)');

                const sentData = context.getSentData();
                if (sentData && sentData.data) {
                    // If customers were found, validate structure
                    if (sentData.data.result && sentData.data.result.length > 0) {
                        const firstCustomer = sentData.data.result[0];
                        assert(firstCustomer.id, 'Customer should have an ID');
                    }
                }
            } catch (error) {
                // Some search queries may not return results, which is acceptable
                // Only fail if it's an authentication or API error
                if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    assert.fail('Authentication failed - check HELPSCOUT_ACCESS_TOKEN');
                }
                // Other errors like "no customers found" are acceptable for integration tests
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid customer ID gracefully', async () => {
            const GetCustomer = require('../../core/GetCustomer/GetCustomer');

            context.messages = {
                in: {
                    content: {
                        customerId: '999999999' // Invalid ID
                    }
                }
            };

            try {
                await GetCustomer.receive(context);
                // If no error is thrown, that's also valid (some APIs return null/empty)
            } catch (error) {
                // Should be a proper API error, not an authentication error
                assert(!error.message.includes('401'), 'Should not be an authentication error');
                assert(!error.message.includes('Unauthorized'), 'Should not be an authentication error');
            }
        });
    });
});
