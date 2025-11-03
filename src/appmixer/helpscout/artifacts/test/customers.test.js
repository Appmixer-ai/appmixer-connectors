'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import HelpScout customer components
const CreateCustomer = require('../../core/CreateCustomer/CreateCustomer');
const GetCustomer = require('../../core/GetCustomer/GetCustomer');
const UpdateCustomer = require('../../core/UpdateCustomer/UpdateCustomer');
const FindCustomers = require('../../core/FindCustomers/FindCustomers');

describe('HelpScout Customers Tests', function() {

    let context;

    beforeEach(() => {
        context = appmixer.createMockContext({
            auth: {
                accessToken: process.env.HELPSCOUT_ACCESS_TOKEN || 'test-token'
            }
        });
    });

    before(function() {
        if (!process.env.HELPSCOUT_ACCESS_TOKEN) {
            console.log('⚠️  Skipping HelpScout Customer tests - HELPSCOUT_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    describe('CreateCustomer', () => {
        it('should throw error when firstName is missing', async () => {
            const input = {
                lastName: 'Test',
                emailValue: 'test@example.com'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateCustomer.receive(context);
                assert.fail('Should have thrown error for missing firstName');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert(error.message.includes('First Name is required'));
            }
        });

        it('should throw error when lastName is missing', async () => {
            const input = {
                firstName: 'Test',
                emailValue: 'test@example.com'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateCustomer.receive(context);
                assert.fail('Should have thrown error for missing lastName');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert(error.message.includes('Last Name is required'));
            }
        });

        it('should throw error when emailValue is missing', async () => {
            const input = {
                firstName: 'Test',
                lastName: 'User'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateCustomer.receive(context);
                assert.fail('Should have thrown error for missing emailValue');
            } catch (error) {
                assert.strictEqual(error.name, 'CancelError');
                assert(error.message.includes('Email is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(CreateCustomer, 'CreateCustomer component should exist');
            assert(typeof CreateCustomer.receive === 'function', 'CreateCustomer should have receive method');
        });
    });

    describe('GetCustomer', () => {
        it('should throw error when customerId is missing', async () => {
            const input = {};

            context.messages = { in: { content: input } };

            try {
                await GetCustomer.receive(context);
                assert.fail('Should have thrown error for missing customerId');
            } catch (error) {
                assert(error.message.includes('Customer ID is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(GetCustomer, 'GetCustomer component should exist');
            assert(typeof GetCustomer.receive === 'function', 'GetCustomer should have receive method');
        });
    });

    describe('UpdateCustomer', () => {
        it('should throw error when customerId is missing', async () => {
            const input = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            context.messages = { in: { content: input } };

            try {
                await UpdateCustomer.receive(context);
                assert.fail('Should have thrown error for missing customerId');
            } catch (error) {
                assert(error.message.includes('Customer ID is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(UpdateCustomer, 'UpdateCustomer component should exist');
            assert(typeof UpdateCustomer.receive === 'function', 'UpdateCustomer should have receive method');
        });
    });

    describe('FindCustomers', () => {
        it('should handle basic query search', async () => {
            const input = {
                query: 'test@example.com',
                outputType: 'array'
            };

            context.messages = { in: { content: input } };

            // Mock httpRequest to return test data
            context.httpRequest = async () => ({
                data: {
                    _embedded: {
                        customers: [
                            {
                                id: 123,
                                firstName: 'Test',
                                lastName: 'User',
                                emails: [{ value: 'test@example.com' }]
                            }
                        ]
                    }
                }
            });

            const result = await FindCustomers.receive(context);
            assert(result, 'FindCustomers should return a result');
        });

        it('should handle first output type', async () => {
            const input = {
                query: 'test@example.com',
                outputType: 'first'
            };

            context.messages = { in: { content: input } };

            // Mock httpRequest to return test data
            context.httpRequest = async () => ({
                data: {
                    _embedded: {
                        customers: [
                            {
                                id: 123,
                                firstName: 'Test',
                                lastName: 'User',
                                emails: [{ value: 'test@example.com' }]
                            }
                        ]
                    }
                }
            });

            const result = await FindCustomers.receive(context);
            assert(result, 'FindCustomers should return a result');
        });

        it('should validate that component exists and has receive method', () => {
            assert(FindCustomers, 'FindCustomers component should exist');
            assert(typeof FindCustomers.receive === 'function', 'FindCustomers should have receive method');
        });
    });
});
