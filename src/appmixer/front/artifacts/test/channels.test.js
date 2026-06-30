'use strict';

const assert = require('assert');
const appmixer = require('../../../../../test/utils');

const CreateChannel = require('../../channels/CreateChannel/CreateChannel');
const GetChannel = require('../../channels/GetChannel/GetChannel');
const UpdateChannel = require('../../channels/UpdateChannel/UpdateChannel');
const ListChannels = require('../../channels/ListChannels/ListChannels');

describe('Front Channels Tests', () => {

    let context;

    beforeEach(() => {
        context = appmixer.createMockContext({
            auth: {
                accessToken: process.env.FRONT_ACCESS_TOKEN || 'test-token'
            }
        });
    });

    describe('CreateChannel', () => {
        it('should send provided channel name in create payload and keep it in output', async () => {
            context.messages = {
                in: {
                    content: {
                        inboxId: 'inb_test',
                        name: 'E2E Test Channel',
                        undoSendTime: '5'
                    }
                }
            };

            context.httpRequest.callsFake(async (request) => {
                return {
                    data: {
                        id: 'cha_test',
                        name: request.data.name || '0c354e6ac2de5fbe',
                        address: '0c354e6ac2de5fbe'
                    }
                };
            });

            await CreateChannel.receive(context);

            assert.strictEqual(context.httpRequest.calledOnce, true);
            const request = context.httpRequest.firstCall.args[0];
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, 'https://api2.frontapp.com/inboxes/inb_test/channels');
            assert.strictEqual(request.data.name, 'E2E Test Channel');
            assert.strictEqual(context.sendJson.calledWithMatch({ name: 'E2E Test Channel' }, 'out'), true);
        });

        it('should throw error when inboxId is missing', async () => {
            context.messages = {
                in: {
                    content: {
                        name: 'E2E Test Channel'
                    }
                }
            };

            try {
                await CreateChannel.receive(context);
                assert.fail('Should have thrown error');
            } catch (error) {
                assert(error.message.includes('Inbox ID is required'));
            }
        });
    });

    describe('GetChannel', () => {
        it('should validate component exists', () => {
            assert(GetChannel, 'GetChannel component should exist');
            assert(typeof GetChannel.receive === 'function', 'GetChannel should have receive method');
        });
    });

    describe('UpdateChannel', () => {
        it('should validate component exists', () => {
            assert(UpdateChannel, 'UpdateChannel component should exist');
            assert(typeof UpdateChannel.receive === 'function', 'UpdateChannel should have receive method');
        });
    });

    describe('ListChannels', () => {
        it('should validate component exists', () => {
            assert(ListChannels, 'ListChannels component should exist');
            assert(typeof ListChannels.receive === 'function', 'ListChannels should have receive method');
        });
    });
});
