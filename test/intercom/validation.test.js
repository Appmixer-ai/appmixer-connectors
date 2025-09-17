const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createMockContext } = require('../utils');
const httpRequest = require('./httpRequest');

// Make createMockContext available globally
global.createMockContext = createMockContext;

describe('Intercom Connector Comprehensive Validation', () => {

    let context;

    beforeEach(() => {
        context = global.createMockContext({
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            httpRequest: httpRequest
        });
    });

    describe('Authentication Validation', () => {
        it('should have valid access token', () => {
            assert(process.env.INTERCOM_ACCESS_TOKEN, 'Access token should be defined');
            assert(process.env.INTERCOM_ACCESS_TOKEN.length > 0, 'Access token should not be empty');
        });
    });

    describe('Contact Components', () => {
        const FindContacts = require('../../src/appmixer/intercom/core/FindContacts/FindContacts');
        const CreateContact = require('../../src/appmixer/intercom/core/CreateContact/CreateContact');

        it('should list contacts successfully', async () => {
            context.messages = {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            };

            await FindContacts.receive(context);
            assert(context.sendJson.calledOnce, 'Should send response');
            const result = context.sendJson.firstCall.args[0];
            assert(result.result, 'Should return result');
            assert(Array.isArray(result.result), 'Result should be array');
        });

        it('should create contact successfully', async () => {
            const randomEmail = `validation-test-${Date.now()}@example.com`;

            context.messages = {
                in: {
                    content: {
                        email: randomEmail,
                        name: 'Validation Test User'
                    }
                }
            };

            await CreateContact.receive(context);
            assert(context.sendJson.calledOnce, 'Should send response');
            const result = context.sendJson.firstCall.args[0];
            assert(result.id, 'Should return contact id');
            assert.strictEqual(result.email, randomEmail, 'Should return correct email');
        });
    });

    describe('Company Components', () => {
        const FindCompanies = require('../../src/appmixer/intercom/core/FindCompanies/FindCompanies');

        it('should list companies successfully', async () => {
            context.messages = {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            };

            await FindCompanies.receive(context);
            assert(context.sendJson.calledOnce, 'Should send response');
            const result = context.sendJson.firstCall.args[0];
            assert(result.result, 'Should return result');
            assert(Array.isArray(result.result), 'Result should be array');
        });
    });

    describe('Error Handling', () => {
        const CreateContact = require('../../src/appmixer/intercom/core/CreateContact/CreateContact');

        it('should handle missing required fields properly', async () => {
            context.messages = {
                in: {
                    content: {
                        name: 'Test without email'
                    }
                }
            };

            try {
                await CreateContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof context.CancelError, 'Should throw CancelError');
                assert(error.message.includes('Email is required'), 'Should have proper error message');
            }
        });
    });
});
