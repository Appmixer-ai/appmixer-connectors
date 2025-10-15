'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import Front conversation components
const FindConversations = require('../../conversation/FindConversations/FindConversations');
const GetConversation = require('../../conversation/GetConversation/GetConversation');
const UpdateConversation = require('../../conversation/UpdateConversation/UpdateConversation');

describe('Front Conversation Tests', () => {

    let context;

    beforeEach(() => {
        context = appmixer.createMockContext({
            auth: {
                accessToken: process.env.FRONT_ACCESS_TOKEN || 'test-token'
            }
        });
    });

    describe('FindConversations', () => {
        it('should validate component exists', () => {
            assert(FindConversations, 'FindConversations component should exist');
            assert(typeof FindConversations.receive === 'function', 'FindConversations should have receive method');
        });

        it('should generate output port options when requested', async () => {
            const input = { outputType: 'array' };

            context.properties = { generateOutputPortOptions: true };
            context.messages = { in: { content: input } };

            await FindConversations.receive(context);

            // Verify sendJson was called - the lib should have sent port options
            assert(context.sendJson.called, 'sendJson should have been called for output port options');
        });
    });

    describe('GetConversation', () => {
        it('should throw error when ID is missing', async () => {
            const input = {};

            context.messages = { in: { content: input } };

            try {
                await GetConversation.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Conversation ID is required'));
            }
        });

        it('should validate component exists', () => {
            assert(GetConversation, 'GetConversation component should exist');
            assert(typeof GetConversation.receive === 'function', 'GetConversation should have receive method');
        });
    });

    describe('UpdateConversation', () => {
        it('should validate component exists', () => {
            assert(UpdateConversation, 'UpdateConversation component should exist');
            assert(typeof UpdateConversation.receive === 'function', 'UpdateConversation should have receive method');
        });
    });
});
