'use strict';

/**
 * Integration tests for Front connector
 * These tests require a real FRONT_ACCESS_TOKEN environment variable
 *
 * To run these tests:
 * 1. Set FRONT_ACCESS_TOKEN environment variable with your Front API token
 * 2. Run: npm run test-unit -- "src/appmixer/front/artifacts/test/integration.test.js"
 *
 * Note: These tests will make real API calls and may create/modify data in your Front account
 */

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import Front components
const GetContact = require('../../contacts/GetContact/GetContact');
const FindContacts = require('../../contacts/FindContacts/FindContacts');
const GetMessage = require('../../message/GetMessage/GetMessage');
const GetConversation = require('../../conversation/GetConversation/GetConversation');

describe('Front Integration Tests', function() {
    this.timeout(30000); // Increase timeout for API calls

    let context;

    before(function() {
        if (!process.env.FRONT_ACCESS_TOKEN) {
            this.skip();
        }
    });

    beforeEach(() => {
        context = appmixer.createMockContext({
            auth: {
                accessToken: process.env.FRONT_ACCESS_TOKEN
            }
        });

        // Mock httpRequest to make real HTTP calls
        context.httpRequest = async function(options) {
            const https = require('https');
            const http = require('http');

            const URL = require('url').URL;

            return new Promise((resolve, reject) => {
                const url = new URL(options.url);
                const protocol = url.protocol === 'https:' ? https : http;

                // Build query string if params exist
                if (options.params) {
                    const params = new URLSearchParams();
                    for (const [key, value] of Object.entries(options.params)) {
                        if (Array.isArray(value)) {
                            value.forEach(v => params.append(key, v));
                        } else {
                            params.append(key, value);
                        }
                    }
                    url.search = params.toString();
                }

                const requestOptions = {
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname + url.search,
                    method: options.method || 'GET',
                    headers: options.headers || {}
                };

                // Prepare request body
                let body = '';
                if (options.data) {
                    if (typeof options.data === 'object') {
                        body = JSON.stringify(options.data);
                        requestOptions.headers['Content-Type'] = 'application/json';
                    } else {
                        body = options.data;
                    }
                    requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
                }

                const req = protocol.request(requestOptions, (res) => {
                    let responseBody = '';
                    res.on('data', chunk => {
                        responseBody += chunk;
                    });

                    res.on('end', () => {
                        try {
                            const data = responseBody ? JSON.parse(responseBody) : {};
                            if (res.statusCode >= 400) {
                                const error = new Error(`HTTP ${res.statusCode}: ${data.message || responseBody}`);
                                error.status = res.statusCode;
                                error.response = { data };
                                reject(error);
                            } else {
                                resolve({ data, status: res.statusCode });
                            }
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                req.on('error', reject);

                if (body) {
                    req.write(body);
                }
                req.end();
            });
        };
    });

    describe('FindContacts Integration', () => {
        it('should find contacts from real API', async () => {
            const input = { outputType: 'array' };

            context.messages = { in: { content: input } };

            try {
                const result = await FindContacts.receive(context);

                // Verify the component behaved correctly
                if (result && result.data && result.data.result) {
                    assert(Array.isArray(result.data.result), 'Should return an array of contacts');
                    console.log(`✓ Found ${result.data.result.length} contacts`);

                    if (result.data.result.length > 0) {
                        const firstContact = result.data.result[0];
                        assert(firstContact.id, 'Contact should have an ID');
                        assert(firstContact.name || firstContact.handles, 'Contact should have a name or handles');
                        console.log(`✓ First contact: ${firstContact.name || firstContact.id}`);
                    }
                } else {
                    console.log('✓ No contacts found (notFound response)');
                }

            } catch (error) {
                if (error.status === 401) {
                    console.log('✗ Authentication failed - check FRONT_ACCESS_TOKEN');
                    throw error;
                } else if (error.status === 403) {
                    console.log('✗ Forbidden - check API token permissions');
                    throw error;
                } else {
                    console.log(`✗ API Error: ${error.message}`);
                    throw error;
                }
            }
        });

        it('should handle sorting parameters', async () => {
            const input = {
                sortBy: 'updated_at',
                sortOrder: 'desc',
                outputType: 'first'
            };

            context.messages = { in: { content: input } };

            try {
                const result = await FindContacts.receive(context);

                if (result && result.data) {
                    if (result.data.id) {
                        console.log(`✓ Got first contact with sorting: ${result.data.id}`);
                        assert(typeof result.data.index === 'number', 'Should have index');
                        assert(typeof result.data.count === 'number', 'Should have count');
                    } else {
                        console.log('✓ No contacts found with sorting');
                    }
                }
            } catch (error) {
                console.log(`✗ Sorting test failed: ${error.message}`);
                throw error;
            }
        });
    });

    describe('Component Error Handling', () => {
        it('should handle invalid contact ID gracefully', async () => {
            const input = { id: 'invalid_contact_id' };

            context.messages = { in: { content: input } };

            try {
                await GetContact.receive(context);
                assert.fail('Should have thrown error for invalid ID');
            } catch (error) {
                assert(error.status === 404 || error.message.includes('not found'),
                    'Should get 404 or not found error');
                console.log('✓ Correctly handled invalid contact ID');
            }
        });

        it('should handle invalid message ID gracefully', async () => {
            const input = { id: 'invalid_message_id' };

            context.messages = { in: { content: input } };

            try {
                await GetMessage.receive(context);
                assert.fail('Should have thrown error for invalid ID');
            } catch (error) {
                assert(error.status === 404 || error.message.includes('not found'),
                    'Should get 404 or not found error');
                console.log('✓ Correctly handled invalid message ID');
            }
        });

        it('should handle invalid conversation ID gracefully', async () => {
            const input = { id: 'invalid_conversation_id' };

            context.messages = { in: { content: input } };

            try {
                await GetConversation.receive(context);
                assert.fail('Should have thrown error for invalid ID');
            } catch (error) {
                assert(error.status === 404 || error.message.includes('not found'),
                    'Should get 404 or not found error');
                console.log('✓ Correctly handled invalid conversation ID');
            }
        });
    });
});
