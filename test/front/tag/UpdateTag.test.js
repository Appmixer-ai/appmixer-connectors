'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils.js');

describe('UpdateTag Component', function() {
    let context;
    let UpdateTag;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            this.skip();
            return;
        }

        UpdateTag = require('../../../src/appmixer/front/tag/UpdateTag/UpdateTag.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/tag/UpdateTag/component.json');

            assert(typeof UpdateTag.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.tag.UpdateTag', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });

    describe('Input Validation', function() {
        it('should require tag ID', async function() {
            context.messages = { in: { content: {} } };

            try {
                await UpdateTag.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Tag ID is required'), 'Should require tag ID');
            }
        });

        it('should accept valid tag data with mock response', async function() {
            context.messages = {
                in: {
                    content: {
                        id: 'tag_123',
                        name: 'Updated Tag',
                        highlight: 'red',
                        is_private: true
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => ({
                data: {
                    id: 'tag_123',
                    name: 'Updated Tag',
                    highlight: 'red',
                    is_private: true,
                    created_at: Date.now() - 86400000, // 1 day ago
                    updated_at: Date.now()
                }
            });

            await UpdateTag.receive(context);
            assert(context.lastSent.data.id === 'tag_123', 'Result should have correct id');
            assert(context.lastSent.data.name === 'Updated Tag', 'Result should have updated name');
            assert(context.lastSent.data.highlight === 'red', 'Result should have updated highlight');
            assert(context.lastSent.data.is_private === true, 'Result should have updated privacy');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });

        it('should handle partial updates', async function() {
            context.messages = {
                in: {
                    content: {
                        id: 'tag_123',
                        name: 'Updated Name Only'
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async (options) => {
                // Verify only the name field is sent
                assert(options.data.name === 'Updated Name Only', 'Should send updated name');
                assert(options.data.highlight === undefined, 'Should not send highlight');
                assert(options.data.is_private === undefined, 'Should not send is_private');

                return {
                    data: {
                        id: 'tag_123',
                        name: 'Updated Name Only',
                        highlight: 'blue', // existing value
                        is_private: false, // existing value
                        created_at: Date.now() - 86400000,
                        updated_at: Date.now()
                    }
                };
            };

            await UpdateTag.receive(context);
            assert(context.lastSent.data.name === 'Updated Name Only', 'Result should have updated name');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });

    describe('API Integration', function() {
        it('should handle API errors gracefully', async function() {
            // Mock error response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => {
                const error = new Error('Tag not found');
                error.response = { status: 404 };
                throw error;
            };

            context.messages = {
                in: {
                    content: {
                        id: 'invalid_tag_id',
                        name: 'Updated Name'
                    }
                }
            };

            try {
                await UpdateTag.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof Error, 'Should throw an error');
            }

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });
});
