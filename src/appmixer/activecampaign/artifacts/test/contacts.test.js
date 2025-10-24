'use strict';

const assert = require('assert');

describe('ActiveCampaign Contact Components Validation', function() {

    describe('CreateContact', function() {
        const CreateContact = require('../../contacts/CreateContact/CreateContact.js');

        it('should throw error when email is missing', async function() {
            const context = {
                messages: { in: { content: { firstName: 'John', lastName: 'Doe', phone: '1234567890' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateContact.receive(context);
                assert.fail('Should have thrown CancelError for missing email');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Email is required');
            }
        });

        it('should throw error when firstName is missing', async function() {
            const context = {
                messages: { in: { content: { email: 'test@test.com', lastName: 'Doe', phone: '1234567890' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateContact.receive(context);
                assert.fail('Should have thrown CancelError for missing firstName');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'First name is required');
            }
        });

        it('should throw error when lastName is missing', async function() {
            const context = {
                messages: { in: { content: { email: 'test@test.com', firstName: 'John', phone: '1234567890' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateContact.receive(context);
                assert.fail('Should have thrown CancelError for missing lastName');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Last name is required');
            }
        });

        it('should throw error when phone is missing', async function() {
            const context = {
                messages: { in: { content: { email: 'test@test.com', firstName: 'John', lastName: 'Doe' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await CreateContact.receive(context);
                assert.fail('Should have thrown CancelError for missing phone');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Phone is required');
            }
        });
    });

    describe('UpdateContact', function() {
        const UpdateContact = require('../../contacts/UpdateContact/UpdateContact.js');

        it('should throw error when contactId is missing', async function() {
            const context = {
                messages: { in: { content: { email: 'test@test.com' } } },
                CancelError: class CancelError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'CancelError';
                    }
                }
            };

            try {
                await UpdateContact.receive(context);
                assert.fail('Should have thrown CancelError for missing contactId');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact is required');
            }
        });
    });

    describe('DeleteContact', function() {
        const DeleteContact = require('../../contacts/DeleteContact/DeleteContact.js');

        it('should throw error when contactId is missing', async function() {
            const context = {
                messages: { in: { content: {} } },
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
                assert.strictEqual(error.name, 'CancelError');
                assert.strictEqual(error.message, 'Contact is required');
            }
        });
    });
});
