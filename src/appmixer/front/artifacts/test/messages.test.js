'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

// Import Front message components
const GetMessage = require('../../message/GetMessage/GetMessage');
const CreateMessage = require('../../message/CreateMessage/CreateMessage');
const ReplyMessage = require('../../message/ReplyMessage/ReplyMessage');

describe('Front Messages Tests', () => {

    let context;

    beforeEach(() => {
        context = appmixer.createMockContext({
            auth: {
                accessToken: process.env.FRONT_ACCESS_TOKEN || 'test-token'
            }
        });
    });

    describe('GetMessage', () => {
        it('should throw error when ID is missing', async () => {
            const input = {};

            context.messages = { in: { content: input } };

            try {
                await GetMessage.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Message ID is required'));
            }
        });

        it('should validate component exists', () => {
            assert(GetMessage, 'GetMessage component should exist');
            assert(typeof GetMessage.receive === 'function', 'GetMessage should have receive method');
        });
    });

    describe('CreateMessage', () => {
        it('should validate component exists', () => {
            assert(CreateMessage, 'CreateMessage component should exist');
            assert(typeof CreateMessage.receive === 'function', 'CreateMessage should have receive method');
        });
    });

    describe('ReplyMessage', () => {
        it('should validate component exists', () => {
            assert(ReplyMessage, 'ReplyMessage component should exist');
            assert(typeof ReplyMessage.receive === 'function', 'ReplyMessage should have receive method');
        });
    });
});
