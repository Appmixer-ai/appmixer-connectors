'use strict';

const assert = require('assert');

describe('ActiveCampaign Required Field Validation', function() {

    it('DeleteContact should validate contactId is required', async function() {
        const DeleteContact = require('../../contacts/DeleteContact/DeleteContact.js');

        const context = {
            messages: {
                in: {
                    content: {} // Missing contactId
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
            assert.fail('Should have thrown CancelError for missing contactId');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('required'), 'Error message should mention field is required');
        }
    });
});
