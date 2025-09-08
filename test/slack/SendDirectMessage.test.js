const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../utils.js');

const lib = require('../../src/appmixer/slack/lib.js');

describe('SendDirectMessage component (options focus)', () => {

    let context;
    let sendMessageStub;
    let originalWebApiExports;
    let webApiPath;
    let SendDirectMessage;

    function mockWebClient(openResult = { channel: { id: 'D123' } }) {
        const { resolve } = require;
        webApiPath = resolve('@slack/web-api');
        originalWebApiExports = require.cache[webApiPath] && require.cache[webApiPath].exports;

        class FakeWebClient {
            constructor() {}
        }
        FakeWebClient.prototype.conversations = {
            open: sinon.stub().resolves(openResult)
        };

        require.cache[webApiPath].exports = { WebClient: FakeWebClient };
    }

    beforeEach(() => {
        // Mock Slack WebClient before requiring the component
        mockWebClient();
        // Now require the component so it picks up our mocked WebClient
        SendDirectMessage = require('../../src/appmixer/slack/messages/SendDirectMessage/SendDirectMessage.js');

        context = testUtils.createMockContext();
        context.auth = { accessToken: 'xoxb-fake' };
        context.messages = {
            in: {
                content: {
                    userIds: ['U1', 'U2'],
                    text: 'Hello DM',
                    username: 'MySlackBot',
                    iconUrl: 'https://example.com/icon.png'
                }
            }
        };

        sendMessageStub = sinon.stub(lib, 'sendMessage').resolves({ text: 'ok' });
    });

    afterEach(() => {
        if (sendMessageStub) sendMessageStub.restore();
        // Restore @slack/web-api exports and clear component from cache
        if (webApiPath && originalWebApiExports) {
            require.cache[webApiPath].exports = originalWebApiExports;
        }
        delete require.cache[require.resolve('../../src/appmixer/slack/messages/SendDirectMessage/SendDirectMessage.js')];
    });

    it('passes username and iconUrl in options when provided', async () => {
        await SendDirectMessage.receive(context);

        assert.equal(sendMessageStub.callCount, 1);
        const args = sendMessageStub.getCall(0).args;
        assert.deepStrictEqual(args[6], { username: 'MySlackBot', iconUrl: 'https://example.com/icon.png' });
    });

    it('uses empty options when neither username nor iconUrl is provided', async () => {
        context.messages.in.content.username = undefined;
        context.messages.in.content.iconUrl = undefined;

        await SendDirectMessage.receive(context);

        assert.equal(sendMessageStub.callCount, 1);
        const args = sendMessageStub.getCall(0).args;
        assert.deepStrictEqual(args[6], {});
    });
});
