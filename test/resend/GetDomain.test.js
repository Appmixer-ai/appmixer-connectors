/**
 * Test suite for Resend GetDomain component
 *
 * This test suite validates the GetDomain component which retrieves information
 * about a specific domain by its ID through the Resend API. It includes:
 * - Domain retrieval functionality using real domains
 * - Input validation and error handling
 * - Response structure validation
 * - Integration with CreateDomain for end-to-end testing
 * - Automatic cleanup of created test domains
 *
 * The tests respect Resend's rate limits and automatically clean up
 * any domains created during testing.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { rateLimitDelay } = require('./testUtils');

describe('GetDomain Component', function() {
    let context;
    let GetDomain;
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

        GetDomain = require(path.join(__dirname, '../../src/appmixer/resend/core/GetDomain/GetDomain.js'));
        CreateDomain = require(path.join(__dirname, '../../src/appmixer/resend/core/CreateDomain/CreateDomain.js'));
        DeleteDomain = require(path.join(__dirname, '../../src/appmixer/resend/core/DeleteDomain/DeleteDomain.js'));

        // Base context that can be modified for different tests
        context = {
            auth: {
                apiKey: process.env.RESEND_API_KEY
            },
            messages: {
                in: {
                    content: {
                        id: 'will-be-set-by-tests'
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

    // Helper function to create a test domain
    async function createTestDomain(domainName) {
        const createContext = {
            ...context,
            messages: {
                in: {
                    content: { domain: domainName }
                }
            }
        };

        await CreateDomain.receive(createContext);
        const domainId = createContext.lastSent.data.id;
        createdDomainIds.push(domainId);
        return domainId;
    }

    // Cleanup function to delete created domains
    async function cleanupDomain(domainId) {
        if (!domainId) return;

        try {
            await rateLimitDelay(); // Respect rate limits
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

    it('should create and retrieve domain details', async function() {
        // First create a test domain
        const testDomainName = `test-get-${Date.now()}.example.com`;
        const domainId = await createTestDomain(testDomainName);

        // Now retrieve the domain details
        context.messages.in.content.id = domainId;
        await GetDomain.receive(context);

        // Verify the response
        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');
        assert(context.lastSent.data, 'Response should contain data');

        const domainData = context.lastSent.data;
        assert(typeof domainData.id === 'string', 'Domain should have id');
        assert(domainData.id === domainId, 'Retrieved domain ID should match created domain ID');
        assert(typeof domainData.name === 'string', 'Domain should have name');
        assert(domainData.name === testDomainName, 'Domain name should match created domain name');
        assert(typeof domainData.status === 'string', 'Domain should have status');

        console.log('✓ Retrieved domain details:', domainData.name, '(ID:', domainData.id, 'Status:', domainData.status + ')');
    });

    it('should throw error when domain ID is missing', async function() {
        const contextWithoutId = {
            ...context,
            messages: {
                in: {
                    content: {} // Empty content, no id field
                }
            }
        };

        try {
            await GetDomain.receive(contextWithoutId);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Domain ID is required'), 'Error message should mention required Domain ID');
        }
    });

    it('should throw error when domain ID is empty string', async function() {
        const contextWithEmptyId = {
            ...context,
            messages: {
                in: {
                    content: { id: '' }
                }
            }
        };

        try {
            await GetDomain.receive(contextWithEmptyId);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error instanceof context.CancelError, 'Should throw CancelError');
            assert(error.message.includes('Domain ID is required'), 'Error message should mention required Domain ID');
        }
    });

    it('should handle non-existent domain gracefully', async function() {
        const nonExistentId = 'non-existent-domain-' + Date.now();
        context.messages.in.content.id = nonExistentId;

        try {
            await GetDomain.receive(context);
            assert.fail('Should have thrown an error for non-existent domain');
        } catch (error) {
            // Expect 404 error for non-existent domain
            assert(error.message, 'Error should have a message');
            console.log('✓ Non-existent domain handled gracefully:', error.message);
        }
    });

    it('should verify response structure using existing domain', async function() {
        // Use the domain created in the first test to avoid rate limiting
        if (createdDomainIds.length === 0) {
            this.skip(); // Skip if no domains were created in previous tests
        }

        const domainId = createdDomainIds[0]; // Use the first created domain

        // Retrieve the domain
        context.messages.in.content.id = domainId;
        await GetDomain.receive(context);

        // Verify complete response structure
        assert(context.lastSent, 'Should have sent data');
        assert(context.lastSent.outputPort === 'out', 'Should send to out port');
        assert(context.lastSent.data, 'Response should contain data');

        const domainData = context.lastSent.data;

        // Verify all expected fields are present with correct types
        assert(typeof domainData.id === 'string' && domainData.id.length > 0, 'Domain should have valid id');
        assert(typeof domainData.name === 'string' && domainData.name.length > 0, 'Domain should have valid name');
        assert(typeof domainData.status === 'string' && domainData.status.length > 0, 'Domain should have valid status');

        // Optional fields that might be present
        if (domainData.created_at) {
            assert(typeof domainData.created_at === 'string', 'created_at should be string if present');
        }
        if (domainData.region) {
            assert(typeof domainData.region === 'string', 'region should be string if present');
        }

        console.log('✓ Domain structure verified:', {
            id: domainData.id,
            name: domainData.name,
            status: domainData.status,
            created_at: domainData.created_at || 'not provided',
            region: domainData.region || 'not provided'
        });
    });

    it('should demonstrate end-to-end domain workflow', async function() {
        // This test demonstrates the complete workflow: Create -> Get -> Cleanup
        // We reuse existing domain to avoid rate limiting

        if (createdDomainIds.length === 0) {
            console.log('ℹ No domains available for workflow test');
            this.skip();
        }

        const domainId = createdDomainIds[0];
        console.log(`ℹ Testing workflow with existing domain ID: ${domainId}`);

        // Step 1: Verify we can retrieve the domain
        context.messages.in.content.id = domainId;
        await GetDomain.receive(context);

        const retrievedDomain = context.lastSent.data;
        assert(retrievedDomain.id === domainId, 'Retrieved domain should match requested ID');

        // Step 2: Verify the domain has expected properties
        assert(retrievedDomain.name, 'Domain should have a name');
        assert(retrievedDomain.status, 'Domain should have a status');

        console.log('✓ End-to-end workflow verified:');
        console.log(`  Created domain: ${retrievedDomain.name}`);
        console.log(`  Retrieved by ID: ${retrievedDomain.id}`);
        console.log(`  Current status: ${retrievedDomain.status}`);
        console.log('  ✓ Cleanup will be handled automatically');
    });
});
