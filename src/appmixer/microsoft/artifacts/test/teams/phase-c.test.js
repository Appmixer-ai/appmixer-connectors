const assert = require('assert');
const fs = require('fs');
const path = require('path');
const testUtils = require('../../../../../../test/utils.js');
const { chatMessage } = require('../../../teams/schemas.js');
const UpdateMessage = require('../../../teams/UpdateMessage/UpdateMessage.js');
const DeleteMessage = require('../../../teams/DeleteMessage/DeleteMessage.js');
const GetMessage = require('../../../teams/GetMessage/GetMessage.js');
const ListMessageReplies = require('../../../teams/ListMessageReplies/ListMessageReplies.js');
const CreateChannel = require('../../../teams/CreateChannel/CreateChannel.js');
const ListTeamMembers = require('../../../teams/ListTeamMembers/ListTeamMembers.js');
const NewChannelMessage = require('../../../teams/NewChannelMessage/NewChannelMessage.js');
const NewTeamMember = require('../../../teams/NewTeamMember/NewTeamMember.js');
const ListChannels = require('../../../teams/ListChannels/ListChannels.js');

const componentJson = (name) => require(`../../../teams/${name}/component.json`);
const plain = (value) => JSON.parse(JSON.stringify(value));

const BASE = 'https://graph.microsoft.com/v1.0';
const TEAM_ID = 'fbe2bf47-16c8-47cf-b4a5-4b9b187c508b';
const CHANNEL_ID = '19:4a95f7d8db4c4e7fae857bcebe0623e6@thread.tacv2';
const ENCODED_CHANNEL_ID = encodeURIComponent(CHANNEL_ID);
const CHAT_ID = '19:2da4c29f6d7041eca70b638b43d45437@thread.v2';
const ENCODED_CHAT_ID = encodeURIComponent(CHAT_ID);
const ME_ID = '8ea0e38b-efb3-4757-924a-5f94061cf8c2';
const MESSAGE_ID = '1616990032035';
const REPLY_ID = '1616990171266';
const MEMBERSHIP_ID = 'MCMjMjMjMGUyMzNjNTgtMmQ3Ni00MmQ1LWFmMDUtZTY1YTM3YjY0NmQy=';

const CHANNEL_MESSAGES = `/teams/${TEAM_ID}/channels/${ENCODED_CHANNEL_ID}/messages`;

const graphError = (status) => Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, headers: {}, data: { error: { code: 'ErrorCode', message: 'Failed' } } }
});

// Dispatch by path so a test can assert which endpoints were hit, in any order.
const routes = (map) => (options) => {

    const path = (options.url || '').replace(BASE, '');
    const handler = map[path];

    if (handler === undefined) {
        return Promise.reject(new Error(`unexpected request ${options.method} ${path}`));
    }
    return typeof handler === 'function' ? handler(options) : Promise.resolve({ data: handler });
};

describe('Microsoft Teams - phase C', function() {

    let context;

    beforeEach(function() {

        context = testUtils.createMockContext();
        context.auth = { accessToken: 'token' };
        context.properties = {};
        context.getWebhookUrl.returns('https://hooks.appmixer.test/abc');
    });

    describe('UpdateMessage', function() {

        it('replaces the body of a channel reply and outputs {}', async function() {

            context.messages = {
                in: {
                    content: {
                        teamId: TEAM_ID,
                        channelId: CHANNEL_ID,
                        messageId: REPLY_ID,
                        parentMessageId: MESSAGE_ID,
                        content: '<b>Edited</b>',
                        contentType: 'html'
                    }
                }
            };
            context.httpRequest.resolves({ data: '' });

            await UpdateMessage.receive(context);

            const request = context.httpRequest.args[0][0];
            assert.strictEqual(request.method, 'PATCH');
            assert.strictEqual(request.url, `${BASE}${CHANNEL_MESSAGES}/${MESSAGE_ID}/replies/${REPLY_ID}`);
            assert.deepStrictEqual(request.data, { body: { contentType: 'html', content: '<b>Edited</b>' } });
            assert.deepStrictEqual(context.sendJson.args[0], [{}, 'out']);
        });

        it('edits a chat message as text by default', async function() {

            context.messages = { in: { content: { location: 'chat', chatId: CHAT_ID, messageId: MESSAGE_ID, content: 'Edited' } } };
            context.httpRequest.resolves({ data: '' });

            await UpdateMessage.receive(context);

            const request = context.httpRequest.args[0][0];
            assert.strictEqual(request.url, `${BASE}/chats/${ENCODED_CHAT_ID}/messages/${MESSAGE_ID}`);
            assert.deepStrictEqual(request.data, { body: { contentType: 'text', content: 'Edited' } });
        });

        it('validates the target and the content before calling Graph', async function() {

            const inputs = { teamId: TEAM_ID, channelId: CHANNEL_ID, messageId: MESSAGE_ID, content: 'x' };
            const cases = [
                [{ ...inputs, teamId: undefined }, /Team is required!/],
                [{ ...inputs, channelId: undefined }, /Channel is required!/],
                [{ location: 'chat', messageId: MESSAGE_ID, content: 'x' }, /Chat is required!/],
                [{ ...inputs, messageId: undefined }, /Message ID is required!/],
                [{ ...inputs, content: undefined }, /Content is required!/]
            ];

            for (const [content, error] of cases) {
                context.messages = { in: { content } };
                await assert.rejects(UpdateMessage.receive(context), error);
            }

            assert.strictEqual(context.httpRequest.callCount, 0);
        });
    });

    describe('DeleteMessage', function() {

        it('soft-deletes a channel message', async function() {

            context.messages = { in: { content: { teamId: TEAM_ID, channelId: CHANNEL_ID, messageId: MESSAGE_ID } } };
            context.httpRequest.resolves({ data: '' });

            await DeleteMessage.receive(context);

            const request = context.httpRequest.args[0][0];
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, `${BASE}${CHANNEL_MESSAGES}/${MESSAGE_ID}/softDelete`);
            assert.deepStrictEqual(context.sendJson.args[0], [{}, 'out']);
        });

        it('soft-deletes a chat message under the signed-in user', async function() {

            context.messages = { in: { content: { location: 'chat', chatId: CHAT_ID, messageId: MESSAGE_ID } } };
            const softDelete = `/users/${ME_ID}/chats/${ENCODED_CHAT_ID}/messages/${MESSAGE_ID}/softDelete`;
            context.httpRequest.callsFake(routes({ '/me': { id: ME_ID }, [softDelete]: '' }));

            await DeleteMessage.receive(context);

            assert.strictEqual(context.httpRequest.args[1][0].method, 'POST');
            assert.deepStrictEqual(context.sendJson.args[0], [{}, 'out']);
        });

        it('requires a message ID', async function() {

            context.messages = { in: { content: { teamId: TEAM_ID, channelId: CHANNEL_ID } } };

            await assert.rejects(DeleteMessage.receive(context), /Message ID is required!/);
        });
    });

    describe('GetMessage', function() {

        it('reads a chat message with its reactions', async function() {

            const message = { id: MESSAGE_ID, messageType: 'message', reactions: [{ reactionType: '👍' }] };
            context.messages = { in: { content: { location: 'chat', chatId: CHAT_ID, messageId: MESSAGE_ID } } };
            context.httpRequest.callsFake(routes({ [`/chats/${ENCODED_CHAT_ID}/messages/${MESSAGE_ID}`]: message }));

            await GetMessage.receive(context);

            assert.deepStrictEqual(context.sendJson.args[0], [message, 'out']);
        });

        it('reads a channel reply', async function() {

            const content = { teamId: TEAM_ID, channelId: CHANNEL_ID, messageId: REPLY_ID };
            content.parentMessageId = MESSAGE_ID;
            context.messages = { in: { content } };
            const replyPath = `${CHANNEL_MESSAGES}/${MESSAGE_ID}/replies/${REPLY_ID}`;
            context.httpRequest.callsFake(routes({ [replyPath]: { id: REPLY_ID } }));

            await GetMessage.receive(context);

            assert.deepStrictEqual(context.sendJson.args[0], [{ id: REPLY_ID }, 'out']);
        });

        it('declares the shared chatMessage schema on its output port', function() {

            assert.deepStrictEqual(componentJson('GetMessage').outPorts[0].schema, plain(chatMessage));
        });
    });

    describe('ListMessageReplies', function() {

        it('pages through the replies 50 at a time', async function() {

            const path = `${CHANNEL_MESSAGES}/${MESSAGE_ID}/replies`;
            context.messages = { in: { content: { teamId: TEAM_ID, channelId: CHANNEL_ID, messageId: MESSAGE_ID } } };
            context.httpRequest.onFirstCall().resolves({
                data: { value: [{ id: '1' }], '@odata.nextLink': `${BASE}${path}?$top=50&$skiptoken=abc` }
            });
            context.httpRequest.onSecondCall().resolves({ data: { value: [{ id: '2' }] } });

            await ListMessageReplies.receive(context);

            assert.strictEqual(context.httpRequest.args[0][0].url, `${BASE}${path}`);
            assert.deepStrictEqual(context.httpRequest.args[0][0].params, { $top: 50 });
            assert.deepStrictEqual(context.sendJson.args[0], [{ result: [{ id: '1' }, { id: '2' }], count: 2 }, 'out']);
        });

        it('requires the root message', async function() {

            context.messages = { in: { content: { teamId: TEAM_ID, channelId: CHANNEL_ID } } };

            await assert.rejects(ListMessageReplies.receive(context), /Message ID is required!/);
        });

        it('generates the output port options without calling Graph', async function() {

            context.properties = { generateOutputPortOptions: true };
            context.messages = { in: { content: { outputType: 'array' } } };

            await ListMessageReplies.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 0);
            const [options] = context.sendJson.args[0];
            assert.strictEqual(options[1].value, 'result');
            assert.deepStrictEqual(options[1].schema.items.properties, chatMessage.properties);
        });
    });

    describe('CreateChannel', function() {

        it('creates a standard channel', async function() {

            const channel = { id: CHANNEL_ID, displayName: 'Launch', membershipType: 'standard' };
            context.messages = { in: { content: { teamId: TEAM_ID, displayName: 'Launch', description: 'Launch prep' } } };
            context.httpRequest.callsFake(routes({ [`/teams/${TEAM_ID}/channels`]: channel }));

            await CreateChannel.receive(context);

            assert.deepStrictEqual(context.httpRequest.args[0][0].data, {
                displayName: 'Launch', membershipType: 'standard', description: 'Launch prep'
            });
            assert.deepStrictEqual(context.sendJson.args[0], [channel, 'out']);
        });

        it('makes the caller the owner of a private channel', async function() {

            context.messages = { in: { content: { teamId: TEAM_ID, displayName: 'Secret', membershipType: 'private' } } };
            context.httpRequest.callsFake(routes({ '/me': { id: ME_ID }, [`/teams/${TEAM_ID}/channels`]: { id: CHANNEL_ID } }));

            await CreateChannel.receive(context);

            assert.deepStrictEqual(context.httpRequest.args[1][0].data.members, [{
                '@odata.type': '#microsoft.graph.aadUserConversationMember',
                'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${ME_ID}')`,
                roles: ['owner']
            }]);
        });

        it('requires a team and a name', async function() {

            context.messages = { in: { content: { displayName: 'Launch' } } };
            await assert.rejects(CreateChannel.receive(context), /Team is required!/);

            context.messages = { in: { content: { teamId: TEAM_ID } } };
            await assert.rejects(CreateChannel.receive(context), /Name is required!/);
        });

        it('declares the ListChannels item schema on its output port', function() {

            assert.deepStrictEqual(componentJson('CreateChannel').outPorts[0].schema, plain(ListChannels.ITEM_SCHEMA));
        });
    });

    describe('ListTeamMembers', function() {

        it('lists the members of the team', async function() {

            const members = [{ id: MEMBERSHIP_ID, userId: ME_ID, displayName: 'Robin Kline', roles: ['owner'] }];
            context.messages = { in: { content: { teamId: TEAM_ID, outputType: 'first' } } };
            context.httpRequest.callsFake(routes({ [`/teams/${TEAM_ID}/members`]: { value: members } }));

            await ListTeamMembers.receive(context);

            assert.deepStrictEqual(context.httpRequest.args[0][0].params, { $top: 999 });
            assert.deepStrictEqual(context.sendJson.args[0], [{ ...members[0], index: 0, count: 1 }, 'out']);
        });

        it('requires a team', async function() {

            context.messages = { in: { content: {} } };

            await assert.rejects(ListTeamMembers.receive(context), /Team is required!/);
        });
    });

    describe('NewChannelMessage', function() {

        const message = {
            id: MESSAGE_ID,
            messageType: 'message',
            from: { user: { id: 'someone-else' } },
            body: { contentType: 'text', content: 'Hello' }
        };
        const reply = { ...message, id: REPLY_ID, replyToId: MESSAGE_ID };
        const rootResource = `teams('${TEAM_ID}')/channels('${CHANNEL_ID}')/messages('${MESSAGE_ID}')`;
        const replyResource = `${rootResource}/replies('${REPLY_ID}')`;
        const notification = (resource, extra = {}) => ({
            webhook: { content: { query: {}, data: { value: [{ clientState: 'secret', resource, ...extra }] } } }
        });

        const watching = async () => {

            context.properties = { teamId: TEAM_ID, channelId: CHANNEL_ID };
            await context.stateSet('clientState', 'secret');
            await context.stateSet('meId', ME_ID);
            await context.stateSet('subscriptionId', 'sub-1');
        };

        it('subscribes to the channel messages', async function() {

            context.properties = { teamId: TEAM_ID, channelId: CHANNEL_ID };
            context.httpRequest.callsFake(routes({ '/me': { id: ME_ID }, '/subscriptions': { id: 'sub-1' } }));

            await NewChannelMessage.start(context);

            const body = context.httpRequest.args[1][0].data;
            assert.strictEqual(body.resource, `/teams/${TEAM_ID}/channels/${CHANNEL_ID}/messages`);
            assert.strictEqual(body.changeType, 'created');
            assert.strictEqual(body.lifecycleNotificationUrl, body.notificationUrl);
            assert.strictEqual(await context.stateGet('meId'), ME_ID);
            assert.strictEqual(context.setTimeout.callCount, 1);
        });

        it('requires a team and a channel to start', async function() {

            context.properties = { teamId: TEAM_ID };

            await assert.rejects(NewChannelMessage.start(context), /Team and Channel are required!/);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('emits a new root message', async function() {

            await watching();
            context.messages = notification(rootResource);
            context.httpRequest.callsFake(routes({ [`${CHANNEL_MESSAGES}/${MESSAGE_ID}`]: message }));

            await NewChannelMessage.receive(context);

            assert.deepStrictEqual(context.sendJson.args[0], [message, 'out']);
            assert.ok(context.response.calledWith('', 200));
        });

        it('skips replies without reading them unless Include Replies is on', async function() {

            await watching();
            context.messages = notification(replyResource);

            await NewChannelMessage.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 0);
            assert.strictEqual(context.sendJson.callCount, 0);
        });

        it('emits a reply, read under its root message, with Include Replies on', async function() {

            await watching();
            context.properties.includeReplies = true;
            context.messages = notification(replyResource);
            context.httpRequest.callsFake(routes({ [`${CHANNEL_MESSAGES}/${MESSAGE_ID}/replies/${REPLY_ID}`]: reply }));

            await NewChannelMessage.receive(context);

            assert.deepStrictEqual(context.sendJson.args[0], [reply, 'out']);
        });

        it('skips a reply Graph names like a root message when Include Replies is off', async function() {

            await watching();
            context.messages = notification(rootResource);
            context.httpRequest.callsFake(routes({ [`${CHANNEL_MESSAGES}/${MESSAGE_ID}`]: reply }));

            await NewChannelMessage.receive(context);

            assert.strictEqual(context.sendJson.callCount, 0);
        });

        it('skips the user own messages, system events and foreign notifications', async function() {

            await watching();
            context.messages = {
                webhook: {
                    content: {
                        query: {},
                        data: {
                            value: [
                                { clientState: 'secret', resource: rootResource },
                                { clientState: 'secret', resource: `teams('${TEAM_ID}')/channels('${CHANNEL_ID}')/messages('2')` },
                                { clientState: 'other', resource: rootResource }
                            ]
                        }
                    }
                }
            };
            context.httpRequest.callsFake(routes({
                [`${CHANNEL_MESSAGES}/${MESSAGE_ID}`]: { ...message, from: { user: { id: ME_ID } } },
                [`${CHANNEL_MESSAGES}/2`]: { ...message, id: '2', messageType: 'systemEventMessage' }
            }));

            await NewChannelMessage.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 2);
            assert.strictEqual(context.sendJson.callCount, 0);
        });

        it('keeps going when the message was deleted before it could be read', async function() {

            await watching();
            context.messages = notification(rootResource);
            context.httpRequest.rejects(graphError(404));

            await NewChannelMessage.receive(context);

            assert.strictEqual(context.sendJson.callCount, 0);
            assert.ok(context.response.calledWith('', 200));
        });

        it('recreates the subscription on a subscriptionRemoved lifecycle event', async function() {

            await watching();
            await context.stateSet('resource', `/teams/${TEAM_ID}/channels/${CHANNEL_ID}/messages`);
            context.messages = notification(rootResource, { lifecycleEvent: 'subscriptionRemoved' });
            context.httpRequest.callsFake(routes({ '/subscriptions': { id: 'sub-2' } }));

            await NewChannelMessage.receive(context);

            assert.strictEqual(context.httpRequest.args[0][0].data.resource, `/teams/${TEAM_ID}/channels/${CHANNEL_ID}/messages`);
            assert.strictEqual(await context.stateGet('subscriptionId'), 'sub-2');
            assert.strictEqual(context.sendJson.callCount, 0);
        });

        it('test() emits the newest root message the trigger would emit', async function() {

            context.properties = { teamId: TEAM_ID, channelId: CHANNEL_ID };
            const own = { ...message, id: '3', from: { user: { id: ME_ID } } };
            context.httpRequest.callsFake(routes({
                '/me': { id: ME_ID },
                [CHANNEL_MESSAGES]: { value: [own, message] },
                [`${CHANNEL_MESSAGES}/${MESSAGE_ID}`]: message
            }));

            await NewChannelMessage.test(context);

            assert.deepStrictEqual(context.httpRequest.args[0][0].params, { $top: 20 });
            assert.deepStrictEqual(context.sendJson.args[0], [message, 'out']);
            assert.strictEqual(context.stateSet.callCount, 0);
        });

        it('test() throws when no recent message qualifies', async function() {

            context.properties = { teamId: TEAM_ID, channelId: CHANNEL_ID };
            context.httpRequest.callsFake(routes({ '/me': { id: ME_ID }, [CHANNEL_MESSAGES]: { value: [] } }));

            await assert.rejects(NewChannelMessage.test(context), /No recent message in the channel/);
        });

        it('feeds the Channel picker the team from the trigger properties', function() {

            const { messages } = componentJson('NewChannelMessage').properties.inspector.inputs.channelId.source.data;
            assert.strictEqual(messages['in/teamId'], 'properties/teamId');
        });

        it('declares the shared chatMessage schema on its output port', function() {

            const json = componentJson('NewChannelMessage');
            assert.deepStrictEqual(json.outPorts[0].schema, plain(chatMessage));
            assert.strictEqual(json.webhook, true);
            assert.strictEqual(json.inPorts, undefined);
        });
    });

    describe('NewTeamMember', function() {

        const member = { id: MEMBERSHIP_ID, userId: ME_ID, displayName: 'Robin Kline', roles: [] };
        const memberPath = `/teams/${TEAM_ID}/members/${encodeURIComponent(MEMBERSHIP_ID)}`;
        const notification = (extra = {}) => ({
            webhook: {
                content: {
                    query: {},
                    data: {
                        value: [{
                            clientState: 'secret',
                            resource: `teams('${TEAM_ID}')/members('${MEMBERSHIP_ID}')`,
                            ...extra
                        }]
                    }
                }
            }
        });

        const watching = async () => {

            context.properties = { teamId: TEAM_ID };
            await context.stateSet('clientState', 'secret');
            await context.stateSet('subscriptionId', 'sub-1');
        };

        it('subscribes to members added to the team', async function() {

            context.properties = { teamId: TEAM_ID };
            context.httpRequest.callsFake(routes({ '/subscriptions': { id: 'sub-1' } }));

            await NewTeamMember.start(context);

            const body = context.httpRequest.args[0][0].data;
            assert.strictEqual(body.resource, `/teams/${TEAM_ID}/members`);
            assert.strictEqual(body.changeType, 'created');
            assert.strictEqual(body.lifecycleNotificationUrl, body.notificationUrl);
            assert.strictEqual(context.setTimeout.callCount, 1);
        });

        it('emits the member the notification points at, with an encoded membership ID', async function() {

            await watching();
            context.messages = notification();
            context.httpRequest.callsFake(routes({ [memberPath]: member }));

            await NewTeamMember.receive(context);

            assert.deepStrictEqual(context.sendJson.args[0], [member, 'out']);
            assert.ok(context.response.calledWith('', 200));
        });

        it('skips a member removed before the notification was processed', async function() {

            await watching();
            context.messages = notification();
            context.httpRequest.rejects(graphError(404));

            await NewTeamMember.receive(context);

            assert.strictEqual(context.sendJson.callCount, 0);
        });

        it('drops a notification whose clientState does not match', async function() {

            await watching();
            context.messages = notification({ clientState: 'other' });

            await NewTeamMember.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('deletes the subscription on stop', async function() {

            await watching();
            context.httpRequest.resolves({ data: '' });

            await NewTeamMember.stop(context);

            assert.strictEqual(context.httpRequest.args[0][0].method, 'DELETE');
            assert.strictEqual(context.httpRequest.args[0][0].url, `${BASE}/subscriptions/sub-1`);
        });

        it('test() emits a current member of the team', async function() {

            context.properties = { teamId: TEAM_ID };
            context.httpRequest.callsFake(routes({ [`/teams/${TEAM_ID}/members`]: { value: [member] } }));

            await NewTeamMember.test(context);

            assert.deepStrictEqual(context.sendJson.args[0], [member, 'out']);
        });

        it('declares the ListTeamMembers item schema on its output port', function() {

            assert.deepStrictEqual(componentJson('NewTeamMember').outPorts[0].schema, plain(ListTeamMembers.ITEM_SCHEMA));
        });
    });

    describe('inspector sources', function() {

        // Every `inputs/<port>/<field>` or `properties/<field>` a source sends must name a field
        // the component has; otherwise the picker is fed an empty value and shows nothing.
        it('map only fields the component declares', function() {

            const dir = path.join(__dirname, '../../../teams');
            const fieldsOf = (section) => new Set([
                ...Object.keys(section?.schema?.properties || {}),
                ...Object.keys(section?.inspector?.inputs || {})
            ]);

            const components = fs.readdirSync(dir).filter((entry) => fs.existsSync(path.join(dir, entry, 'component.json')));

            for (const name of components) {
                const json = componentJson(name);
                const ports = Object.fromEntries((json.inPorts || []).map((port) => [port.name, fieldsOf(port)]));
                const properties = fieldsOf(json.properties);
                const sources = [
                    ...(json.inPorts || []).flatMap((port) => Object.values(port.inspector?.inputs || {})),
                    ...Object.values(json.properties?.inspector?.inputs || {}),
                    ...(json.outPorts || [])
                ].map((holder) => holder.source).filter(Boolean);

                for (const { data = {} } of sources) {
                    const values = [...Object.values(data.messages || {}), ...Object.values(data.properties || {})];
                    for (const value of values) {
                        const [kind, port, field] = String(value).split('/');
                        if (kind === 'inputs') {
                            assert.ok(ports[port]?.has(field), `${name} maps ${value}, which it does not have`);
                        } else if (kind === 'properties') {
                            assert.ok(properties.has(port), `${name} maps ${value}, which it does not have`);
                        }
                    }
                }
            }
        });
    });
});
