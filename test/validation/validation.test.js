const assert = require('assert');

// Test that validation is correctly added to a few components

describe('Required field validation', function() {

    it('activecampaign DeleteContact should validate contactId', async function() {
        const DeleteContact = require('../../src/appmixer/activecampaign/contacts/DeleteContact/DeleteContact.js');
        const context = {
            messages: {
                in: {
                    content: {} // No contactId
                }
            },
            CancelError: class CancelError extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        try {
            await DeleteContact.receive(context);
            assert.fail('Should have thrown error for missing contactId');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('required'), 'Error message should mention required');
        }
    });

    it('clickup CreateTask should validate listId and name', async function() {
        const CreateTask = require('../../src/appmixer/clickup/core/CreateTask/CreateTask.js');
        const context = {
            messages: {
                in: {
                    content: {} // No listId or name
                }
            },
            CancelError: class CancelError extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        try {
            await CreateTask.receive(context);
            assert.fail('Should have thrown error for missing listId');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('required'), 'Error message should mention required');
        }
    });

    it('brevo CreateContact should validate email', async function() {
        const CreateContact = require('../../src/appmixer/brevo/core/CreateContact/CreateContact.js');
        const context = {
            messages: {
                in: {
                    content: {} // No email
                }
            },
            CancelError: class CancelError extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        try {
            await CreateContact.receive(context);
            assert.fail('Should have thrown error for missing email');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('required'), 'Error message should mention required');
        }
    });
});
