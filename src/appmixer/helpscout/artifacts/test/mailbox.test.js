'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import HelpScout mailbox components
const ListMailboxes = require('../../core/ListMailboxes/ListMailboxes');
const ListEmails = require('../../core/ListEmails/ListEmails');
const ListTags = require('../../core/ListTags/ListTags');
const GetCurrentUser = require('../../core/GetCurrentUser/GetCurrentUser');

describe('HelpScout Mailbox Tests', function() {

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
            console.log('⚠️  Skipping HelpScout Mailbox tests - HELPSCOUT_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    describe('ListMailboxes', () => {
        it('should list mailboxes with array output', async () => {
            const input = { outputType: 'array' };
            context.messages = { in: { content: input } };

            // Mock httpRequest to return test data
            context.httpRequest = async () => ({
                data: {
                    _embedded: {
                        mailboxes: [
                            {
                                id: 123,
                                name: 'Support',
                                email: 'support@example.com'
                            }
                        ]
                    }
                }
            });

            const result = await ListMailboxes.receive(context);
            assert(result, 'ListMailboxes should return a result');
        });

        it('should list mailboxes with first output', async () => {
            const input = { outputType: 'first' };
            context.messages = { in: { content: input } };

            // Mock httpRequest to return test data
            context.httpRequest = async () => ({
                data: {
                    _embedded: {
                        mailboxes: [
                            {
                                id: 123,
                                name: 'Support',
                                email: 'support@example.com'
                            }
                        ]
                    }
                }
            });

            const result = await ListMailboxes.receive(context);
            assert(result, 'ListMailboxes should return a result');
        });

        it('should validate that component exists and has receive method', () => {
            assert(ListMailboxes, 'ListMailboxes component should exist');
            assert(typeof ListMailboxes.receive === 'function', 'ListMailboxes should have receive method');
        });
    });

    describe('ListEmails', () => {
        it('should throw error when customerId is missing', async () => {
            const input = { outputType: 'array' };
            context.messages = { in: { content: input } };

            try {
                await ListEmails.receive(context);
                assert.fail('Should have thrown error for missing customerId');
            } catch (error) {
                assert(error.message.includes('Customer ID is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(ListEmails, 'ListEmails component should exist');
            assert(typeof ListEmails.receive === 'function', 'ListEmails should have receive method');
        });
    });

    describe('ListTags', () => {
        it('should list tags with array output', async () => {
            const input = { outputType: 'array' };
            context.messages = { in: { content: input } };

            // Mock httpRequest to return test data
            context.httpRequest = async () => ({
                data: {
                    _embedded: {
                        tags: [
                            {
                                id: 123,
                                name: 'urgent',
                                color: '#FF0000'
                            }
                        ]
                    }
                }
            });

            const result = await ListTags.receive(context);
            assert(result, 'ListTags should return a result');
        });

        it('should validate that component exists and has receive method', () => {
            assert(ListTags, 'ListTags component should exist');
            assert(typeof ListTags.receive === 'function', 'ListTags should have receive method');
        });
    });

    describe('GetCurrentUser', () => {
        it('should get current user details', async () => {
            const input = {};
            context.messages = { in: { content: input } };

            // Mock httpRequest to return test data
            context.httpRequest = async () => ({
                data: {
                    id: 123,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com'
                }
            });

            const result = await GetCurrentUser.receive(context);
            assert(result, 'GetCurrentUser should return a result');
        });

        it('should validate that component exists and has receive method', () => {
            assert(GetCurrentUser, 'GetCurrentUser component should exist');
            assert(typeof GetCurrentUser.receive === 'function', 'GetCurrentUser should have receive method');
        });
    });
});
