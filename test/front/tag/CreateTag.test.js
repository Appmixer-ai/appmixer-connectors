'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils.js');

describe('CreateTag Component', function() {
    let context;
    let CreateTag;

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

        CreateTag = require('../../../src/appmixer/front/tag/CreateTag/CreateTag.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/tag/CreateTag/component.json');

            assert(typeof CreateTag.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.tag.CreateTag', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });

    describe('Input Validation', function() {
        it('should require tag name', async function() {
            context.messages = { in: { content: {} } };

            try {
                await CreateTag.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Tag name is required'), 'Should require tag name');
            }
        });

        it('should accept valid tag data with mock response', async function() {
            context.messages = {
                in: {
                    content: {
                        name: 'Test Tag',
                        highlight: 'blue',
                        is_private: false
                    }
                }
            };

            // Mock successful response
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => ({
                data: {
                    id: 'tag_123',
                    name: 'Test Tag',
                    highlight: 'blue',
                    is_private: false,
                    created_at: Date.now(),
                    updated_at: Date.now()
                }
            });

            await CreateTag.receive(context);
            assert(context.lastSent.data.id, 'Result should have id');
            assert(context.lastSent.data.name === 'Test Tag', 'Result should have correct name');

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });

    describe('API Integration', function() {
        it('should handle API errors gracefully', async function() {
            // Mock error response  
            const originalHttpRequest = context.httpRequest;
            context.httpRequest = async () => {
                const error = new Error('API Error');
                error.response = { status: 422 };
                throw error;
            };

            context.messages = {
                in: {
                    content: {
                        name: 'Test Tag'
                    }
                }
            };

            try {
                await CreateTag.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof Error, 'Should throw an error');
            }

            // Restore original httpRequest
            context.httpRequest = originalHttpRequest;
        });
    });
});
