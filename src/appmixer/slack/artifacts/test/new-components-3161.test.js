/* eslint-disable camelcase */
const assert = require('assert');
const sinon = require('sinon');
const { WebClient } = require('@slack/web-api');
const testUtils = require('../../../../../test/utils.js');

const lib = require('../../lib.js');
const FindUserByEmail = require('../../list/FindUserByEmail/FindUserByEmail.js');
const InviteUsersToChannel = require('../../list/InviteUsersToChannel/InviteUsersToChannel.js');
const FindChannelMessages = require('../../list/FindChannelMessages/FindChannelMessages.js');
const FindThreadReplies = require('../../list/FindThreadReplies/FindThreadReplies.js');
const ScheduleMessage = require('../../messages/ScheduleMessage/ScheduleMessage.js');
const NewMention = require('../../messages/NewMention/NewMention.js');
const NewReaction = require('../../reactions/NewReaction/NewReaction.js');
const SendChannelMessage = require('../../list/SendChannelMessage/SendChannelMessage.js');
const UpdateMessage = require('../../messages/UpdateMessage/UpdateMessage.js');

describe('issue 3161: new Slack components and the blocks input', () => {

    let context;
    let apiCall;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.auth = { accessToken: 'xoxp-test' };
        context.properties = {};
        // Every WebClient method goes through apiCall(method, options).
        apiCall = sinon.stub(WebClient.prototype, 'apiCall');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('lib.parseBlocks', () => {

        it('parses a JSON array string, keeps arrays and unwraps a Block Kit Builder payload', () => {
            const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: '*Hi*' } }];
            assert.deepStrictEqual(lib.parseBlocks(JSON.stringify(blocks), context), blocks);
            assert.deepStrictEqual(lib.parseBlocks(blocks, context), blocks);
            assert.deepStrictEqual(lib.parseBlocks(JSON.stringify({ blocks }), context), blocks);
        });

        it('returns undefined for empty input', () => {
            assert.strictEqual(lib.parseBlocks(undefined, context), undefined);
            assert.strictEqual(lib.parseBlocks('  ', context), undefined);
            assert.strictEqual(lib.parseBlocks('[]', context), undefined);
        });

        it('rejects invalid JSON and non-arrays', () => {
            assert.throws(() => lib.parseBlocks('[{', context), context.CancelError);
            assert.throws(() => lib.parseBlocks('{"type":"section"}', context), context.CancelError);
        });
    });

    describe('lib.toSlackTimestamp', () => {

        it('keeps Slack ts and Unix timestamps, converts dates to seconds', () => {
            assert.strictEqual(lib.toSlackTimestamp('1737024600.000100', context, 'Oldest'), '1737024600.000100');
            assert.strictEqual(lib.toSlackTimestamp(1737024600, context, 'Oldest'), '1737024600');
            assert.strictEqual(lib.toSlackTimestamp('2025-01-16T10:50:00.000Z', context, 'Oldest'), '1737024600');
            assert.strictEqual(lib.toSlackTimestamp('', context, 'Oldest'), undefined);
            assert.throws(() => lib.toSlackTimestamp('not a date', context, 'Oldest'), context.CancelError);
        });
    });

    describe('FindUserByEmail', () => {

        it('sends the user to out', async () => {
            context.messages = { in: { content: { email: ' jane.doe@example.com ', outputType: 'first' } } };
            context.httpRequest.resolves({ data: { ok: true, user: { id: 'U1', name: 'jane' } } });

            await FindUserByEmail.receive(context);

            assert.strictEqual(context.httpRequest.getCall(0).args[0].url, 'https://slack.com/api/users.lookupByEmail');
            assert.deepStrictEqual(context.httpRequest.getCall(0).args[0].params, { email: 'jane.doe@example.com' });
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{ id: 'U1', name: 'jane' }, 'out']);
        });

        it('sends users_not_found to notFound', async () => {
            context.messages = { in: { content: { email: 'nobody@example.com' } } };
            context.httpRequest.resolves({ data: { ok: false, error: 'users_not_found' } });

            await FindUserByEmail.receive(context);

            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{ email: 'nobody@example.com' }, 'notFound']);
        });

        it('throws other Slack errors', async () => {
            context.messages = { in: { content: { email: 'jane.doe@example.com' } } };
            context.httpRequest.resolves({ data: { ok: false, error: 'missing_scope' } });

            await assert.rejects(() => FindUserByEmail.receive(context), /missing_scope/);
        });
    });

    describe('InviteUsersToChannel', () => {

        it('sends a comma-separated users list and force, returns the channel', async () => {
            context.messages = { in: { content: { channel: 'C1', users: ['U1', 'U2'], force: true } } };
            apiCall.resolves({ ok: true, channel: { id: 'C1', name: 'incident' } });

            await InviteUsersToChannel.receive(context);

            assert.deepStrictEqual(apiCall.getCall(0).args.slice(0, 2), ['conversations.invite', { channel: 'C1', users: 'U1,U2', force: true }]);
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{ id: 'C1', name: 'incident' }, 'out']);
        });

        it('accepts a comma-separated string and rejects more than 1000 users', async () => {
            context.messages = { in: { content: { channel: 'C1', users: 'U1, U2' } } };
            apiCall.resolves({ ok: true, channel: { id: 'C1' } });
            await InviteUsersToChannel.receive(context);
            assert.strictEqual(apiCall.getCall(0).args[1].users, 'U1,U2');
            assert.strictEqual(apiCall.getCall(0).args[1].force, undefined);

            context.messages.in.content.users = Array.from({ length: 1001 }, (v, i) => 'U' + i);
            await assert.rejects(() => InviteUsersToChannel.receive(context), context.CancelError);
        });
    });

    describe('FindChannelMessages', () => {

        it('requests one page with the date window and sends the messages', async () => {
            context.messages = { in: { content: {
                channel: 'C1', oldest: '2025-01-16T10:50:00.000Z', latest: '1737111000.000200', inclusive: true, outputType: 'array'
            } } };
            apiCall.resolves({ ok: true, messages: [{ type: 'message', ts: '1737024700.000100', text: 'a &amp; b' }] });

            await FindChannelMessages.receive(context);

            assert.deepStrictEqual(apiCall.getCall(0).args.slice(0, 2), ['conversations.history', {
                channel: 'C1', limit: 999, oldest: '1737024600', latest: '1737111000.000200', inclusive: true
            }]);
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{
                records: [{ type: 'message', ts: '1737024700.000100', text: 'a & b' }], count: 1
            }, 'out']);
        });

        it('sends an empty result to notFound', async () => {
            context.messages = { in: { content: { channel: 'C1' } } };
            apiCall.resolves({ ok: true, messages: [] });

            await FindChannelMessages.receive(context);

            assert.strictEqual(context.sendJson.getCall(0).args[1], 'notFound');
        });
    });

    describe('FindThreadReplies', () => {

        it('requests the thread and sends parent and replies', async () => {
            context.messages = { in: { content: { channel: 'C1', ts: '1737024600.000100', outputType: 'first' } } };
            apiCall.resolves({ ok: true, messages: [{ type: 'message', ts: '1737024600.000100' }, { type: 'message', ts: '1737024700.000100' }] });

            await FindThreadReplies.receive(context);

            assert.deepStrictEqual(apiCall.getCall(0).args.slice(0, 2), ['conversations.replies', { channel: 'C1', ts: '1737024600.000100', limit: 1000 }]);
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{ type: 'message', ts: '1737024600.000100' }, 'out']);
        });
    });

    describe('ScheduleMessage', () => {

        it('converts postAt to whole seconds and passes blocks and the thread', async () => {
            const blocks = [{ type: 'section', block_id: 'b1', text: { type: 'mrkdwn', text: 'Hi' } }];
            context.messages = { in: { content: {
                channel: 'C1', text: 'Hi', postAt: '2025-01-16T10:50:00.900Z', blocks: JSON.stringify(blocks), threadTs: '1737000000.000100', replyBroadcast: true
            } } };
            apiCall.resolves({ ok: true, channel: 'C1', scheduled_message_id: 'Q1', post_at: 1737024600, message: { text: 'Hi' } });

            await ScheduleMessage.receive(context);

            assert.deepStrictEqual(apiCall.getCall(0).args.slice(0, 2), ['chat.scheduleMessage', {
                channel: 'C1', post_at: 1737024600, text: 'Hi', blocks, thread_ts: '1737000000.000100', reply_broadcast: true
            }]);
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{
                channel: 'C1', scheduled_message_id: 'Q1', post_at: 1737024600, message: { text: 'Hi' }
            }, 'out']);
        });
    });

    describe('blocks on the message components', () => {

        it('SendChannelMessage passes parsed blocks to sendMessage', async () => {
            const blocks = [{ type: 'divider' }];
            context.messages = { message: { content: { channelId: 'C1', text: 'fallback', blocks: JSON.stringify(blocks) } } };
            const sendMessage = sinon.stub(lib, 'sendMessage').resolves({ ts: '1' });

            await SendChannelMessage.receive(context);

            assert.deepStrictEqual(sendMessage.getCall(0).args[6], { blocks });
        });

        it('SendDirectMessage passes parsed blocks to sendMessage', async () => {
            // SendDirectMessage.test.js swaps the cached @slack/web-api and lib.js modules, so load the
            // component fresh here (and drop it again) instead of sharing a cached copy with that file.
            const componentPath = require.resolve('../../messages/SendDirectMessage/SendDirectMessage.js');
            delete require.cache[componentPath];
            const SendDirectMessage = require(componentPath);
            const currentLib = require('../../lib.js');
            delete require.cache[componentPath];

            const blocks = [{ type: 'divider' }];
            context.messages = { in: { content: { userIds: ['U1'], text: 'fallback', blocks: JSON.stringify(blocks) } } };
            apiCall.resolves({ ok: true, channel: { id: 'D1' } });
            const sendMessage = sinon.stub(currentLib, 'sendMessage').resolves({ ts: '1' });

            await SendDirectMessage.receive(context);

            assert.strictEqual(sendMessage.getCall(0).args[1], 'D1');
            assert.deepStrictEqual(sendMessage.getCall(0).args[6], { blocks });
        });

        it('UpdateMessage sends blocks to chat.update only when given', async () => {
            const blocks = [{ type: 'divider' }];
            context.messages = { in: { content: { channel: 'C1', text: 'new', ts: '1', blocks: JSON.stringify(blocks) } } };
            apiCall.resolves({ ok: true, ts: '1' });

            await UpdateMessage.receive(context);
            assert.deepStrictEqual(apiCall.getCall(0).args.slice(0, 2), ['chat.update', { channel: 'C1', text: 'new', ts: '1', blocks }]);

            delete context.messages.in.content.blocks;
            await UpdateMessage.receive(context);
            assert.deepStrictEqual(apiCall.getCall(1).args[1], { channel: 'C1', text: 'new', ts: '1' });
        });
    });

    describe('NewMention', () => {

        it('emits the app_mention event, filtered by channel when set', async () => {
            const event = { type: 'app_mention', user: 'U1', text: '&lt;@B1&gt; hi', ts: '1', channel: 'C1' };
            context.messages = { webhook: { content: { data: { ...event } } } };

            await NewMention.receive(context);
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{ ...event, text: '<@B1> hi' }, 'mention']);

            context.properties = { channelId: 'C2' };
            await NewMention.receive(context);
            assert.strictEqual(context.sendJson.callCount, 1);
        });

        it('test() does not fabricate an event', async () => {
            await assert.rejects(() => NewMention.test(context), context.CancelError);
        });
    });

    describe('NewReaction', () => {

        const event = { type: 'reaction_added', user: 'U1', reaction: 'ticket', item: { type: 'message', channel: 'C1', ts: '1' } };

        it('matches by emoji (with or without colons, any skin tone) and channel', () => {
            assert.strictEqual(NewReaction.matches(event, {}), true);
            assert.strictEqual(NewReaction.matches(event, { reaction: ':ticket:', channelId: 'C1' }), true);
            assert.strictEqual(NewReaction.matches(event, { reaction: 'eyes' }), false);
            assert.strictEqual(NewReaction.matches(event, { channelId: 'C2' }), false);
            assert.strictEqual(NewReaction.matches({ ...event, reaction: 'thumbsup::skin-tone-2' }, { reaction: 'thumbsup' }), true);
        });

        it('receive() emits matching events only', async () => {
            context.properties = { reaction: 'ticket' };
            context.messages = { webhook: { content: { data: event } } };
            await NewReaction.receive(context);
            context.messages = { webhook: { content: { data: { ...event, reaction: 'eyes' } } } };
            await NewReaction.receive(context);

            assert.strictEqual(context.sendJson.callCount, 1);
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [event, 'reaction']);
        });

        it('test() reshapes the latest own reaction into a reaction_added event', async () => {
            apiCall.withArgs('auth.test').resolves({ ok: true, user_id: 'U1' });
            apiCall.withArgs('reactions.list').resolves({ ok: true, items: [{
                type: 'message',
                channel: 'C1',
                message: { ts: '1737024600.000100', user: 'U2', reactions: [{ name: 'eyes', users: ['U3'] }, { name: 'ticket', users: ['U1'] }] }
            }] });

            await NewReaction.test(context);

            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{
                type: 'reaction_added', user: 'U1', reaction: 'ticket', item_user: 'U2',
                item: { type: 'message', channel: 'C1', ts: '1737024600.000100' }
            }, 'reaction']);
        });
    });
});
