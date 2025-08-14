const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../utils.js');

const lib = require('../../src/appmixer/slack/lib.js');
const SendChannelMessage = require('../../src/appmixer/slack/list/SendChannelMessage/SendChannelMessage.js');

describe('SendChannelMessage component', () => {

    let context;
    let sendMessageStub;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = {
            message: {
                content: {
                    channelId: 'C123',
                    text: 'Hello world',
                    asBot: true,
                    thread_ts: '1717171717.000100',
                    reply_broadcast: true,
                    username: 'MySlackBot',
                    iconUrl: 'https://example.com/icon.png'
                }
            }
        };

        sendMessageStub = sinon.stub(lib, 'sendMessage').resolves({ text: 'ok' });
    });

    afterEach(() => {
        if (sendMessageStub) sendMessageStub.restore();
    });

    it('calls sendMessage with options including username and iconUrl when provided', async () => {
        await SendChannelMessage.receive(context);

        assert.equal(sendMessageStub.callCount, 1);
        const args = sendMessageStub.getCall(0).args;

        assert.strictEqual(args[0], context);
        assert.strictEqual(args[1], 'C123');
        assert.strictEqual(args[2], 'Hello world');
        assert.strictEqual(args[3], true);
        assert.strictEqual(args[4], '1717171717.000100');
        assert.strictEqual(args[5], true);
        assert.deepStrictEqual(args[6], { username: 'MySlackBot', iconUrl: 'https://example.com/icon.png' });
    });

    it('calls sendMessage with empty options when username and iconUrl are not provided', async () => {
        context.messages.message.content.username = undefined;
        context.messages.message.content.iconUrl = undefined;

        await SendChannelMessage.receive(context);

        assert.equal(sendMessageStub.callCount, 1);
        const args = sendMessageStub.getCall(0).args;
        assert.deepStrictEqual(args[6], {});
    });
});
