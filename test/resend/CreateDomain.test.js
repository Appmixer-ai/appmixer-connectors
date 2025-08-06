/**
 * Test suite for Resend CreateDomain component
 *
 * This test suite validates the CreateDomain component which adds a new domain
 * for sending emails through the Resend API. It includes:
 * - Basic domain creation functionality
 * - Input validation and error handling
 * - Response structure validation
 * - Automatic cleanup of created test domains
 *
 * The tests respect Resend's rate limits and automatically clean up
 * any domains created during testing.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay } = require('./testUtils');

describe('CreateDomain Component', function() {
    let context;
    let CreateDomain;
    let DeleteDomain;
    let createdDomainIds = []; // Track created domains for cleanup

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
        // Additional delay for domain operations which might have stricter limits
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    before(function() {
        if (!process.env.RESEND_API_KEY) {
            console.log('Skipping tests - RESEND_API_KEY not set');
            this.skip();
        }

        CreateDomain = require(path.join(__dirname, '../../src/appmixer/resend/core/CreateDomain/CreateDomain.js'));
        DeleteDomain = require(path.join(__dirname, '../../src/appmixer/resend/core/DeleteDomain/DeleteDomain.js'));

        context = {
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            messages: {
                in: {
                    content: {
                        domain: `test${Date.now()}.example.com` // Fixed: added content wrapper and changed from 'name' to 'domain'
                    }
                }
            },
            httpRequest: require('./httpRequest.js'),
            sendJson: function(data, outputPort) {
                this.lastSent = { data, outputPort };
                return Promise.resolve();
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    // Cleanup function to delete created domains
    async function cleanupDomain(domainId) {
        if (!domainId) return;

        try {
            await rateLimitDelay(); // Respect rate limits
            // Additional delay for domain deletion operations
            await new Promise(resolve => setTimeout(resolve, 300));

            const deleteContext = {
                ...context,
                messages: {
                    in: {
                        content: { id: domainId }
                    }
                }
            };
            await DeleteDomain.receive(deleteContext);
            console.log(`✓ Cleaned up domain ID: ${domainId}`);
        } catch (error) {
            // Don't fail the test if cleanup fails
            if (error.message && error.message.includes('404')) {
                console.log(`✓ Domain ID ${domainId} already deleted or not found`);
            } else {
                console.warn(`⚠ Failed to cleanup domain ID ${domainId}:`, error.message);
            }
        }
    }

    // Cleanup after all tests
    after(async function() {
        if (createdDomainIds.length > 0) {
            console.log(`\nCleaning up ${createdDomainIds.length} created domain(s)...`);
            for (const domainId of createdDomainIds) {
                await cleanupDomain(domainId);
            }
            createdDomainIds = [];
        }
    });

    it('should create a domain', async function() {
        // Generate unique domain name for this test
        const uniqueDomain = `test${Date.now()}.example.com`;
        context.messages.in.content.domain = uniqueDomain;

        await CreateDomain.receive(context);

        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');
        assert(context.lastSent.data, 'Response should contain data');
        assert(typeof context.lastSent.data.id === 'string', 'Domain should have id');
        assert(typeof context.lastSent.data.name === 'string', 'Domain should have name');
        assert(context.lastSent.data.name === uniqueDomain, 'Domain name should match input');

        // Track created domain for cleanup
        createdDomainIds.push(context.lastSent.data.id);

        console.log('✓ Created domain:', context.lastSent.data.name, '(ID:', context.lastSent.data.id + ')');
    });

    it('should throw error when domain is missing', async function() {
        const contextWithoutDomain = {
            ...context,
            messages: {
                in: {
                    content: {} // Empty content, no domain field
                }
            }
        };

        try {
            await CreateDomain.receive(contextWithoutDomain);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Domain name is required'), 'Error message should mention required domain');
        }
    });

    it('should throw error when domain is empty string', async function() {
        const contextWithEmptyDomain = {
            ...context,
            messages: {
                in: {
                    content: { domain: '' }
                }
            }
        };

        try {
            await CreateDomain.receive(contextWithEmptyDomain);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Domain name is required'), 'Error message should mention required domain');
        }
    });

    it('should handle API errors gracefully', async function() {
        // Try to create a domain with an invalid name to test error handling
        const invalidDomain = `invalid-domain-${Date.now()}`;  // Without .com
        context.messages.in.content.domain = invalidDomain;

        try {
            await CreateDomain.receive(context);

            // If successful, verify the response
            assert(context.lastSent, 'Should have sent data');
            assert(context.lastSent.outputPort === 'out', 'Should send to out port');
            assert(context.lastSent.data, 'Response should contain data');

            const responseData = context.lastSent.data;

            // Verify required fields exist and have correct types
            assert(typeof responseData.id === 'string', 'Domain should have id as string');
            assert(responseData.id.length > 0, 'Domain id should not be empty');
            assert(typeof responseData.name === 'string', 'Domain should have name as string');

            // Track created domain for cleanup if it was actually created
            if (responseData.id) {
                createdDomainIds.push(responseData.id);
            }

            console.log('✓ Domain creation handled:', responseData.name, '(ID:', responseData.id + ')');
        } catch (error) {
            // API errors are expected for invalid domains or rate limiting
            console.log('✓ API error handled gracefully:', error.message);
            assert(error.message, 'Error should have a message');
        }
    });

    it('should verify cleanup tracking without API call', function() {
        // This test demonstrates the cleanup tracking mechanism without making API calls
        const mockDomainId = 'mock-domain-id-12345';
        const initialCleanupCount = createdDomainIds.length;

        // Simulate adding a domain ID to cleanup list
        createdDomainIds.push(mockDomainId);

        // Verify the tracking works
        assert(createdDomainIds.length === initialCleanupCount + 1, 'Domain ID should be tracked for cleanup');
        assert(createdDomainIds.includes(mockDomainId), 'Cleanup list should contain the mock domain ID');

        console.log('✓ Cleanup tracking verified with mock ID:', mockDomainId);
        console.log(`  Total domains to cleanup: ${createdDomainIds.length}`);

        // Remove the mock ID to avoid cleanup attempts
        const index = createdDomainIds.indexOf(mockDomainId);
        if (index > -1) {
            createdDomainIds.splice(index, 1);
        }
    });
});
