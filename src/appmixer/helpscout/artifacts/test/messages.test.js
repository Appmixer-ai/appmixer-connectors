'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import HelpScout message components
const CreateThreadAgentReply = require('../../core/CreateThreadAgentReply/CreateThreadAgentReply');
const CreateThreadInternalNote = require('../../core/CreateThreadInternalNote/CreateThreadInternalNote');

describe('HelpScout Messages Tests', function() {

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
            console.log('⚠️  Skipping HelpScout Message tests - HELPSCOUT_ACCESS_TOKEN not set');
            this.skip();
        }
    });

    describe('CreateThreadAgentReply', () => {
        it('should throw error when conversationId is missing', async () => {
            const input = {
                text: 'Test reply message'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateThreadAgentReply.receive(context);
                assert.fail('Should have thrown error for missing conversationId');
            } catch (error) {
                assert(error.message.includes('Conversation ID is required'));
            }
        });

        it('should throw error when text is missing', async () => {
            const input = {
                conversationId: '123'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateThreadAgentReply.receive(context);
                assert.fail('Should have thrown error for missing text');
            } catch (error) {
                assert(error.message.includes('Text is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(CreateThreadAgentReply, 'CreateThreadAgentReply component should exist');
            assert(typeof CreateThreadAgentReply.receive === 'function', 'CreateThreadAgentReply should have receive method');
        });
    });

    describe('CreateThreadInternalNote', () => {
        it('should throw error when conversationId is missing', async () => {
            const input = {
                text: 'Test internal note'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateThreadInternalNote.receive(context);
                assert.fail('Should have thrown error for missing conversationId');
            } catch (error) {
                assert(error.message.includes('Conversation ID is required'));
            }
        });

        it('should throw error when text is missing', async () => {
            const input = {
                conversationId: '123'
            };

            context.messages = { in: { content: input } };

            try {
                await CreateThreadInternalNote.receive(context);
                assert.fail('Should have thrown error for missing text');
            } catch (error) {
                assert(error.message.includes('Text is required'));
            }
        });

        it('should validate that component exists and has receive method', () => {
            assert(CreateThreadInternalNote, 'CreateThreadInternalNote component should exist');
            assert(typeof CreateThreadInternalNote.receive === 'function', 'CreateThreadInternalNote should have receive method');
        });
    });
});
