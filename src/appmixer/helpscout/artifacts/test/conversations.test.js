'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import HelpScout conversation components
const CreateConversation = require('../../core/CreateConversation/CreateConversation');
const GetConversation = require('../../core/GetConversation/GetConversation');
const UpdateConversation = require('../../core/UpdateConversation/UpdateConversation');
const FindConversations = require('../../core/FindConversations/FindConversations');

describe('HelpScout Conversations Tests', function() {

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
            console.log('⚠️  Skipping HelpScout Conversation tests - HELPSCOUT_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    describe('CreateConversation', () => {
        it('should throw error when subject is missing', async () => {
            const input = {
                mailboxId: '123',
                customerId: '456',
                message: 'Test message'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateConversation.receive(context);
                assert.fail('Should have thrown error for missing subject');
            } catch (error) {
                assert(error.message.includes('Subject is required'));
            }
        });

        it('should throw error when mailboxId is missing', async () => {
            const input = {
                subject: 'Test Subject',
                customerId: '456',
                message: 'Test message'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateConversation.receive(context);
                assert.fail('Should have thrown error for missing mailboxId');
            } catch (error) {
                assert(error.message.includes('Mailbox ID is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(CreateConversation, 'CreateConversation component should exist');
            assert(typeof CreateConversation.receive === 'function', 'CreateConversation should have receive method');
        });
    });

    describe('GetConversation', () => {
        it('should throw error when conversationId is missing', async () => {
            const input = {};

            context.messages = { in: { content: input } };

            try {
                await GetConversation.receive(context);
                assert.fail('Should have thrown error for missing conversationId');
            } catch (error) {
                assert(error.message.includes('Conversation ID is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(GetConversation, 'GetConversation component should exist');
            assert(typeof GetConversation.receive === 'function', 'GetConversation should have receive method');
        });
    });

    describe('UpdateConversation', () => {
        it('should throw error when conversationId is missing', async () => {
            const input = {
                subject: 'Updated Subject'
            };

            context.messages = { in: { content: input } };

            try {
                await UpdateConversation.receive(context);
                assert.fail('Should have thrown error for missing conversationId');
            } catch (error) {
                assert(error.message.includes('Conversation ID is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(UpdateConversation, 'UpdateConversation component should exist');
            assert(typeof UpdateConversation.receive === 'function', 'UpdateConversation should have receive method');
        });
    });

    describe('FindConversations', () => {
        it('should handle basic search', async () => {
            const input = {
                mailbox: '123',
                outputType: 'array'
            };

            context.messages = { in: { content: input } };

            // Mock httpRequest to return test data
            context.httpRequest = async () => ({
                data: {
                    _embedded: {
                        conversations: [
                            {
                                id: 123,
                                subject: 'Test Conversation',
                                status: 'active'
                            }
                        ]
                    }
                }
            });

            const result = await FindConversations.receive(context);
            assert(result, 'FindConversations should return a result');
        });

        it('should validate that component exists and has receive method', () => {
            assert(FindConversations, 'FindConversations component should exist');
            assert(typeof FindConversations.receive === 'function', 'FindConversations should have receive method');
        });
    });
});
