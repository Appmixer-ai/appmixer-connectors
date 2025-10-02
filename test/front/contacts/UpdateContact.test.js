'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('UpdateContact Component', function() {
    let context;
    let UpdateContact;
    let testContactId;

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
        UpdateContact = require(path.join(__dirname, '../../../src/appmixer/front/contacts/UpdateContact/UpdateContact.js'));

        // Set up test contact ID
        testContactId = process.env.FRONT_TEST_CONTACT_ID || 'cnt_test';

        // Use the utility function to create test context
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            assert.strictEqual(typeof UpdateContact, 'object');
            assert.strictEqual(typeof UpdateContact.receive, 'function');
        });
    });

    describe('Input Validation', function() {
        it('should throw CancelError for missing contact ID', async function() {
            context.messages.in = {
                content: {
                    name: 'Updated Name'
                }
            };

            try {
                await UpdateContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });

        it('should throw CancelError for empty contact ID', async function() {
            context.messages.in = {
                content: {
                    id: '',
                    name: 'Updated Name'
                }
            };

            try {
                await UpdateContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact ID is required.');
            }
        });
    });

    describe('API Integration', function() {
        it('should update a contact with name only', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            const updatedName = `Updated Contact ${Date.now()}`;

            context.messages.in = {
                content: {
                    id: testContactId,
                    name: updatedName
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.deepStrictEqual(outputs[0].data, {});
        });

        it('should update a contact with multiple fields', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    id: testContactId,
                    name: `Multi-Field Update ${Date.now()}`,
                    description: 'Updated description',
                    is_spammer: false,
                    avatar_url: 'https://example.com/new-avatar.jpg'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.deepStrictEqual(outputs[0].data, {});
        });

        it('should handle boolean fields correctly', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    id: testContactId,
                    is_spammer: true
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.deepStrictEqual(outputs[0].data, {});
        });

        it('should handle handles (contact methods)', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    id: testContactId,
                    handlesType: 'email',
                    handlesHandle: 'newemail@example.com'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.deepStrictEqual(outputs[0].data, {});
        });

        it('should handle comma-separated links and groups', async function() {
            if (!testContactId.startsWith('cnt_')) {
                console.log('Skipping API test - valid FRONT_TEST_CONTACT_ID not available');
                this.skip();
            }

            context.messages.in = {
                content: {
                    id: testContactId,
                    links: 'https://example.com,https://test.com',
                    groups: 'group1,group2,group3'
                }
            };

            // Mock sendJson to capture the output
            const outputs = [];
            context.sendJson = (data, port) => {
                outputs.push({ data, port });
                return Promise.resolve();
            };

            await UpdateContact.receive(context);

            // Verify output
            assert.strictEqual(outputs.length, 1);
            assert.strictEqual(outputs[0].port, 'out');
            assert.deepStrictEqual(outputs[0].data, {});
        });
    });

    describe('Error Handling', function() {
        it('should handle API errors gracefully', async function() {
            // Test with invalid authentication to trigger an error
            const invalidContext = createTestContext('invalid-token');
            invalidContext.messages.in = {
                content: {
                    id: 'cnt_test',
                    name: 'Updated Name'
                }
            };

            try {
                await UpdateContact.receive(invalidContext);
                assert.fail('Should have thrown an error for invalid token');
            } catch (error) {
                // Should throw an HTTP error, not a CancelError
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });

        it('should handle non-existent contact ID', async function() {
            const nonExistentId = 'cnt_nonexistent123';

            context.messages.in = {
                content: {
                    id: nonExistentId,
                    name: 'Updated Name'
                }
            };

            try {
                await UpdateContact.receive(context);
                assert.fail('Should have thrown an error for non-existent contact');
            } catch (error) {
                // Should throw an HTTP error (likely 404)
                assert.notStrictEqual(error.name, 'CancelError');
            }
        });
    });
});
