'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('CreateContact Component', function() {
    let context;
    let CreateContact;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            console.log('Skipping tests - FRONT_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        CreateContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/CreateContact/CreateContact.js'));

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof CreateContact, 'object');
            assert.strictEqual(typeof CreateContact.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing name', async function() {
            context.messages.in = {
                content: {
                    description: 'Test contact without name'
                }
            };

            try {
                await CreateContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Name is required.');
            }
        });
    });

    describe('API Integration', function() {
        it('should create a contact successfully with minimal data', async function() {
            const testName = `Test Contact ${Date.now()}`;

            context.messages.in = {
                content: {
                    name: testName
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.name, testName);
        });

        it('should create a contact with all optional fields', async function() {
            const testName = `Full Test Contact ${Date.now()}`;

            context.messages.in = {
                content: {
                    name: testName,
                    description: 'A test contact with all fields',
                    avatar_url: 'https://example.com/avatar.jpg',
                    is_spammer: false,
                    links: ['https://example.com'],
                    handles: [{ type: 'email', handle: 'test@example.com' }],
                    groups: ['test-group'],
                    custom_fields: { department: 'Engineering' }
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.strictEqual(typeof outputs[0].data, 'object');
            assert.strictEqual(typeof outputs[0].data.id, 'string');
            assert.strictEqual(outputs[0].data.name, testName);
            assert.strictEqual(outputs[0].data.description, 'A test contact with all fields');
            assert.strictEqual(outputs[0].data.is_spammer, false);
        });

        it('should handle is_spammer boolean correctly', async function() {
            const testName = `Spammer Test Contact ${Date.now()}`;

            context.messages.in = {
                content: {
                    name: testName,
                    is_spammer: true
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await CreateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].data.is_spammer, true);
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {
                    name: 'Test Contact'
                }
            };

            try {
                await CreateContact.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
