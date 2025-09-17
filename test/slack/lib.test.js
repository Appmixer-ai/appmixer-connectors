/* eslint-disable camelcase */
const fs = require('fs');
const { cwd } = require('process');
const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../utils.js');

// Mock the WebClient class from @slack/web-api
// This is necessary to avoid making actual API calls during tests
// and to control the behavior of the WebClient in tests.
let mockWebClient = null;
const mockWebClientClass = class {
    constructor(token) {
        this.token = token;
        // With this, we can further modify the mockWebClient in the tests.
        mockWebClient = this;
    }
    chat = {
        postMessage: sinon.stub().resolves({ message: { text: 'testMessage' } })
    };
};

// Will be assigned in beforeEach after setting up the mock and re-requiring the lib.
let sendMessage;

describe('lib.js', () => {
    describe('normalizeMultiselectInput', () => {
        const context = { CancelError: class CancelError extends Error {} };

        it('should join array of userIds', () => {
            const result = require('../../src/appmixer/slack/lib').normalizeMultiselectInput(['U1', 'U2', 'U3'], 8, context, 'userIds');
            assert.strictEqual(result, 'U1,U2,U3');
        });

        it('should return string userId as is', () => {
            const result = require('../../src/appmixer/slack/lib').normalizeMultiselectInput('U1', 8, context, 'userIds');
            assert.strictEqual(result, 'U1');
        });

        it('should throw if array exceeds maxItems', () => {
            assert.throws(() => {
                require('../../src/appmixer/slack/lib').normalizeMultiselectInput(['U1','U2','U3','U4','U5','U6','U7','U8','U9'], 8, context, 'userIds');
            }, context.CancelError);
        });

        it('should throw if input is not array or string', () => {
            assert.throws(() => {
                require('../../src/appmixer/slack/lib').normalizeMultiselectInput(123, 8, context, 'userIds');
            }, context.CancelError);
        });
    });

    describe('sendMessage - asBot', () => {

        let context;
        const channelId = 'testChannelId';
        const message = 'testMessage';

        before(() => {
            // Stop if there are node modules installed in the connector folder.
            const connectorPath = cwd() + '/src/appmixer/slack/node_modules';
            if (fs.existsSync(connectorPath)) {
                throw new Error(`For testing, please remove node_modules from ${connectorPath}`);
            }
        });

        beforeEach(() => {
            context = testUtils.createMockContext();
            context.auth = {
                accessToken: 'testAccessToken'
            };
            context.messages = {
                message: {
                    content: {
                        iconUrl: 'https://example.com/icon.png',
                        username: 'MySlackBot'
                    }
                }
            };

            // Ensure @slack/web-api is loaded and then replace it with our mock
            // We do this here so that if other tests required the Slack lib earlier,
            // we can re-require it with our mocked dependency.
            require('@slack/web-api');
            require.cache[require.resolve('@slack/web-api')].exports = { WebClient: mockWebClientClass };

            // Force re-evaluation of the slack lib so it picks up the mocked @slack/web-api
            const libPath = require.resolve('../../src/appmixer/slack/lib.js');
            delete require.cache[libPath];
            ({ sendMessage } = require('../../src/appmixer/slack/lib.js'));
        });

        afterEach(() => {
            mockWebClient?.chat?.postMessage?.resetHistory();
            mockWebClient = null;
            delete require.cache[require.resolve('@slack/web-api')];
            // Also remove the slack lib from cache to avoid leaking the mocked version to other suites
            const libPath = require.resolve('../../src/appmixer/slack/lib.js');
            delete require.cache[libPath];
            // Recreate a clean cache entry for @slack/web-api for other tests
            require('@slack/web-api');
            process.env.AUTH_HUB_URL = undefined;
            process.env.AUTH_HUB_TOKEN = undefined;
        });

        it('should call web.chat.postMessage when not using AuthHub', async () => {
            context.auth.profileInfo = { botToken: 'testBotToken' };

            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot' };
            const result = await sendMessage(context, channelId, message, true, undefined, undefined, opts);

            assert.equal(mockWebClient.chat.postMessage.callCount, 1);
            assert.deepEqual(result, { text: 'testMessage' });
            assert.deepEqual(mockWebClient.chat.postMessage.getCall(0).args[0], {
                icon_url: 'https://example.com/icon.png',
                username: 'MySlackBot',
                channel: channelId,
                text: message
            });
        });

        it('should call web.chat.postMessage when using AuthHub but not as bot', async () => {
            context.config.usesAuthHub = true;
            context.auth.profileInfo = { botToken: undefined };
            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot' };
            const result = await sendMessage(context, channelId, message, false, undefined, undefined, opts);
            assert.equal(mockWebClient.chat.postMessage.callCount, 1);
            assert.deepEqual(result, { text: 'testMessage' });
            assert.deepEqual(mockWebClient.chat.postMessage.getCall(0).args[0], {
                icon_url: 'https://example.com/icon.png',
                username: 'MySlackBot',
                channel: channelId,
                text: message
            });
        });

        it('should call AuthHub route when using AuthHub and as bot', async () => {

            process.env.AUTH_HUB_URL = 'https://auth-hub.example.com';
            process.env.AUTH_HUB_TOKEN = 'testAuthHubToken';
            context.config.usesAuthHub = true;

            context.httpRequest = sinon.stub().resolves({
                data: { text: message }
            });

            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot' };
            const result = await sendMessage(context, channelId, message, true, undefined, undefined, opts);

            assert.deepEqual(result, { text: message });
            assert.equal(context.httpRequest.callCount, 1);
            assert.deepEqual(context.httpRequest.getCall(0).args[0], {
                url: process.env.AUTH_HUB_URL + '/plugins/appmixer/slack/auth-hub/send-message',
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.AUTH_HUB_TOKEN}`
                    // 'x-appmixer-version-slack': require('../../src/appmixer/slack/bundle.json').version
                },
                data: {
                    iconUrl: 'https://example.com/icon.png',
                    username: 'MySlackBot',
                    channelId,
                    token: context.auth.profileInfo?.botToken,
                    text: message
                }
            });
        });

        it('should throw an error when not using AuthHub and botToken is not available', async () => {
            context.config.usesAuthHub = undefined;
            context.auth.profileInfo = { botToken: undefined };

            await assert.rejects(
                sendMessage(context, channelId, message, true, undefined, undefined, { iconUrl: 'x', username: 'y' }),
                Error,
                'Bot token is required for sending messages as bot. Please provide it in the connector configuration.'
            );
        });

        it('should send message with thread_ts and reply_broadcast', async () => {
            context.auth.profileInfo = { botToken: 'testBotToken' };
            const thread_ts = '1234567890.123456';
            const reply_broadcast = true;
            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot' };
            const result = await sendMessage(context, channelId, message, true, thread_ts, reply_broadcast, opts);
            assert.equal(mockWebClient.chat.postMessage.callCount, 1);
            assert.deepEqual(result, { text: 'testMessage' });
            assert.deepEqual(mockWebClient.chat.postMessage.getCall(0).args[0], {
                icon_url: 'https://example.com/icon.png',
                username: 'MySlackBot',
                channel: channelId,
                text: message,
                thread_ts,
                reply_broadcast
            });
        });

        it('should send message without thread_ts and reply_broadcast', async () => {
            context.auth.profileInfo = { botToken: 'testBotToken' };
            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot' };
            const result = await sendMessage(context, channelId, message, true, undefined, undefined, opts);
            assert.equal(mockWebClient.chat.postMessage.callCount, 1);
            assert.deepEqual(result, { text: 'testMessage' });
            assert.deepEqual(mockWebClient.chat.postMessage.getCall(0).args[0], {
                icon_url: 'https://example.com/icon.png',
                username: 'MySlackBot',
                channel: channelId,
                text: message
            });
        });

        it('should prefer context.auth.profileInfo.botToken over context.config.botToken', async () => {
            context.config.botToken = 'testBotToken';
            context.auth.accessToken = 'testAccessToken';
            context.auth.profileInfo = { botToken: 'profileBotToken' };
            // Without AuthHub
            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot' };
            const result = await sendMessage(context, channelId, message, true, undefined, undefined, opts);
            // The mockWebClient is constructed with the token, so we can check which token was used
            assert.equal(mockWebClient.token, 'profileBotToken');
            assert.equal(mockWebClient.chat.postMessage.callCount, 1);
            assert.deepEqual(result, { text: 'testMessage' });

            // With AuthHub
            process.env.AUTH_HUB_URL = 'https://auth-hub.example.com';
            process.env.AUTH_HUB_TOKEN = 'testAuthHubToken';
            context.config.usesAuthHub = true;
            context.httpRequest = sinon.stub().resolves({
                data: { text: message }
            });
            const resultAuthHub = await sendMessage(context, channelId, message, true, undefined, undefined, opts);
            assert.equal(mockWebClient.token, 'profileBotToken');
            assert.deepEqual(resultAuthHub, { text: message });
            assert.equal(context.httpRequest.callCount, 1);
            assert.deepEqual(context.httpRequest.getCall(0).args[0], {
                url: process.env.AUTH_HUB_URL + '/plugins/appmixer/slack/auth-hub/send-message',
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.AUTH_HUB_TOKEN}`
                },
                data: {
                    iconUrl: 'https://example.com/icon.png',
                    username: 'MySlackBot',
                    channelId,
                    text: message,
                    token: 'profileBotToken'
                }
            });
        });

        it('should ignore context.messages and use options for iconUrl and username', async () => {
            context.auth.profileInfo = { botToken: 'testBotToken' };
            // context.messages contains different values vs options
            context.messages.message.content.iconUrl = 'https://example.com/icon-from-context.png';
            context.messages.message.content.username = 'ContextSlackBot';
            const opts = { iconUrl: 'https://example.com/icon-from-options.png', username: 'OptionsBot' };

            const result = await sendMessage(context, channelId, message, true, undefined, undefined, opts);
            assert.equal(mockWebClient.chat.postMessage.callCount, 1);
            assert.deepEqual(result, { text: 'testMessage' });
            assert.deepEqual(mockWebClient.chat.postMessage.getCall(0).args[0], {
                icon_url: 'https://example.com/icon-from-options.png',
                username: 'OptionsBot',
                channel: channelId,
                text: message
            });
        });

        it('should forward blocks unchanged when not using AuthHub', async () => {
            context.auth.profileInfo = { botToken: 'testBotToken' };
            const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: '*Hello*' } }];
            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot', blocks };

            const result = await sendMessage(context, channelId, message, true, undefined, undefined, opts);

            assert.equal(mockWebClient.chat.postMessage.callCount, 1);
            assert.deepEqual(result, { text: 'testMessage' });
            assert.deepEqual(mockWebClient.chat.postMessage.getCall(0).args[0], {
                icon_url: 'https://example.com/icon.png',
                username: 'MySlackBot',
                channel: channelId,
                text: message,
                blocks
            });
        });

        it('should include blocks in AuthHub payload when using AuthHub as bot', async () => {
            process.env.AUTH_HUB_URL = 'https://auth-hub.example.com';
            process.env.AUTH_HUB_TOKEN = 'testAuthHubToken';
            context.config.usesAuthHub = true;

            context.httpRequest = sinon.stub().resolves({ data: { text: message } });

            context.auth.profileInfo = { botToken: 'testBotToken' };
            const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: '*AuthHub*' } }];
            const opts = { iconUrl: 'https://example.com/icon.png', username: 'MySlackBot', blocks };

            const result = await sendMessage(context, channelId, message, true, undefined, undefined, opts);

            assert.deepEqual(result, { text: message });
            assert.equal(context.httpRequest.callCount, 1);
            assert.deepEqual(context.httpRequest.getCall(0).args[0], {
                url: process.env.AUTH_HUB_URL + '/plugins/appmixer/slack/auth-hub/send-message',
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.AUTH_HUB_TOKEN}`
                },
                data: {
                    iconUrl: 'https://example.com/icon.png',
                    username: 'MySlackBot',
                    channelId,
                    token: context.auth.profileInfo?.botToken,
                    text: message,
                    blocks
                }
            });
        });
    });
});
